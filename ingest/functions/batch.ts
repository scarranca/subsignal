import { companyQueries } from '@/db/queries/company';
import { inngest } from '../client';
import { extractCompanyName, fetchPageTitle, groupUrlsByHostnames } from '@/lib/url';

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
    { event: 'batch/company.created' },
    async ({ event, step }) => {
        const { userId, urls } = event.data;

        const urlsByHostname = groupUrlsByHostnames(urls);
        console.log('API Handler - Grouped URLs by hostname:', urlsByHostname);

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

        return {
            totalProcessed: processResults.length,
            totalFailed: processResults.filter((result) => result.status === 'rejected').length,
            totalSuccessful: processResults.filter((result) => result.status === 'fulfilled')
                .length,
        };
    },
);
