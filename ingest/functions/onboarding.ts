import { companyQueries } from '@/db/queries/company';
import { preferenceQueries } from '@/db/queries/preference';
import { inngest } from '../client';
import { extractCompanyName, fetchPageTitle, groupUrlsByHostnames } from '@/lib/url';
import { DEFAULT_PREFERENCES } from '@/constants/preferences';
import { emailService } from '@/services/email';

export const sendOnboardingEmail = inngest.createFunction(
    { id: 'send-onboarding-email' },
    { event: 'app/send.onboarding.email' },
    async ({ event, step }) => {
        const { userEmail, userId } = event.data;

        await step.run(`send-onboarding-email-${userId}`, async () => {
            await emailService.sendOnboardingEmail(userEmail);
        });

        return {
            message: `Send onboarding email to ${userEmail}`,
            userId,
            userEmail,
        };
    },
);

/**
 * Batch create companies and pages with resilient error handling
 * @param event.data.userId - The user id
 * @param event.data.urls - Array of URLs to process
 * @returns Promise with detailed results including successes, failures, and statistics
 */
export const batchCreateCompany = inngest.createFunction(
    {
        id: 'batch-create-company',
        priority: { run: '180' },
        rateLimit: {
            limit: 3, // 3 requests per 3 hours for a single user
            period: '3h', // Per 3 hours
            key: 'event.data.userId', // Throttle per userId
        },
        concurrency: [
            {
                key: 'event.data.userId',
                limit: 1, // Only one job at a time for a single user
            },
        ],
        retries: 3, // 3 retries for a single user
    },
    { event: 'onboarding/batch.create.company' },
    async ({ event, step }) => {
        const { userId, urls } = event.data;

        const urlsByHostname = groupUrlsByHostnames(urls);
        console.log('API Handler - Grouped URLs by hostname:', urlsByHostname);

        const newPages: { pageId: string; pageURL: string }[] = [];

        // Process all companies in one step (since it's mostly I/O bound external calls)
        const processResults = await step.run('process-all-companies', async () => {
            const settledResults = await Promise.allSettled(
                Array.from(urlsByHostname).map(async ([companyUrl, pageUrls]) => {
                    try {
                        const companyName = await extractCompanyName(companyUrl);
                        const company = await companyQueries.getOrCreateCompany(
                            userId,
                            companyUrl,
                            companyName,
                        );

                        // Fetch page titles with individual error handling
                        const pageDataResults = await Promise.allSettled(
                            pageUrls.map(async (url: string) => {
                                const pageTitle = await fetchPageTitle(url);
                                return { title: pageTitle, url: url };
                            }),
                        );

                        // Separate successful and failed page fetches
                        const pageData = pageDataResults
                            .filter(
                                (
                                    result,
                                ): result is PromiseFulfilledResult<{
                                    title: string;
                                    url: string;
                                }> => result.status === 'fulfilled',
                            )
                            .map((result) => result.value);

                        const failedPages = pageDataResults
                            .map((result, index) => ({
                                result,
                                index,
                                url: pageUrls[index],
                            }))
                            .filter((item) => item.result.status === 'rejected')
                            .map((item) => ({
                                url: item.url,
                                error:
                                    (item.result as PromiseRejectedResult).reason?.message ||
                                    'Unknown error',
                            }));

                        // Add pages to company (only successful ones)
                        const pages =
                            pageData.length > 0
                                ? await companyQueries.getOrAddPagesToCompany(company.id, pageData)
                                : null;

                        return {
                            success: true,
                            companyUrl,
                            company: company,
                            pages: pages,
                            failedPages,
                            pageStats: {
                                total: pageUrls.length,
                                successful: pageData.length,
                                failed: failedPages.length,
                            },
                        };
                    } catch (error) {
                        console.error(`Failed to process company ${companyUrl}:`, error);
                        return {
                            success: false,
                            companyUrl,
                            error: error instanceof Error ? error.message : 'Unknown error',
                            pageStats: {
                                total: pageUrls.length,
                                successful: 0,
                                failed: pageUrls.length,
                            },
                        };
                    }
                }),
            );

            return settledResults;
        });

        // Process results (simple data manipulation - no need for steps)
        const successfulResults = processResults
            .filter(
                (result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled',
            )
            .map((result) => result.value)
            .filter((value) => value.success);

        const failedResults = processResults
            .filter(
                (result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled',
            )
            .map((result) => result.value)
            .filter((value) => !value.success);

        const unexpectedFailures = processResults
            .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
            .map((result) => ({
                success: false,
                error: result.reason?.message || 'Unexpected processing error',
            }));

        const totalProcessed = successfulResults.length;
        const totalFailed = failedResults.length + unexpectedFailures.length;
        const totalPagesFailed = [...successfulResults, ...failedResults].reduce(
            (sum, result) => sum + (result.pageStats?.failed || 0),
            0,
        );

        // Collect new page IDs
        successfulResults.forEach((result) => {
            if (result.pages?.newPages) {
                newPages.push(
                    ...result.pages.newPages.map((page: any) => ({
                        pageId: page.id,
                        pageURL: page.url,
                    })),
                );
            }
        });

        // Get user preferences (simple DB query)
        let userPreference = null;
        try {
            userPreference = await preferenceQueries.getUserPreference(userId);
        } catch (error) {
            console.error(`Failed to get user preference for user ${userId}:`, error);
        }

        // Send snapshot events (this is worth making durable since it's the actual work)
        if (newPages.length > 0) {
            const snapshotEvents = newPages.map((page: { pageId: string; pageURL: string }) => ({
                name: 'snapshot/create.archive.snapshot',
                data: {
                    pageId: page.pageId,
                    userId: userId,
                    pageProperties: userPreference?.properties || DEFAULT_PREFERENCES.properties,
                    pageURL: page.pageURL,
                },
            }));

            console.log('API Handler - Snapshot events:', snapshotEvents);

            await step.sendEvent('snapshot/create.archive.snapshot', snapshotEvents);
        }

        return {
            message: `Batch processing completed: ${totalProcessed} companies created successfully, ${totalFailed} failed`,
            userId,
            stats: {
                companiesProcessed: totalProcessed,
                companiesFailed: totalFailed,
                totalPagesFailedToFetch: totalPagesFailed,
            },
            results: successfulResults,
            failures: [...failedResults, ...unexpectedFailures],
        };
    },
);
