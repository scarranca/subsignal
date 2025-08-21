import { companyQueries } from '@/db/queries/company';
import { preferenceQueries } from '@/db/queries/preference';
import { inngest } from '../client';
import { extractCompanyName, fetchPageTitle, groupUrlsByHostnames } from '@/lib/url';
import { DEFAULT_PREFERENCES } from '@/constants/preferences';

/**
 * Batch create companies and pages with resilient error handling
 * @param event.data.userId - The user id
 * @param event.data.urls - Array of URLs to process
 * @returns Promise with detailed results including successes, failures, and statistics
 */
export const batchCreateCompany = inngest.createFunction(
    { id: 'batch-create-company', priority: { run: '180' } },
    { event: 'onboarding/batch.create.company' },
    async ({ event, step }) => {
        const { userId, urls } = event.data;

        const urlsByHostname = groupUrlsByHostnames(urls);
        console.log('API Handler - Grouped URLs by hostname:', urlsByHostname);

        const newPages: string[] = [];
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
                            ): result is PromiseFulfilledResult<{ title: string; url: string }> =>
                                result.status === 'fulfilled',
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

                    newPages.push(...(pages?.newPages.map((page) => page.id) || []));

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

        // Separate successful and failed results
        const successfulResults = settledResults
            .filter(
                (result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled',
            )
            .map((result) => result.value)
            .filter((value) => value.success);

        const failedResults = settledResults
            .filter(
                (result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled',
            )
            .map((result) => result.value)
            .filter((value) => !value.success);

        // Handle any Promise.allSettled rejections (shouldn't happen with try-catch, but just in case)
        const unexpectedFailures = settledResults
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

        // Get the user preference
        const userPreference = await preferenceQueries.getUserPreference(userId);

        // Prepare events for snapshot creation
        const snapshotEvents = newPages.map((pageId: string) => ({
            name: 'snapshot/create.archive.snapshot',
            data: {
                pageId: pageId,
                userId: userId,
                pageProperties: userPreference?.properties || DEFAULT_PREFERENCES.properties,
            },
        }));

        console.log('API Handler - Snapshot events:', snapshotEvents);

        // Send events to create snapshot
        if (snapshotEvents.length > 0) {
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
