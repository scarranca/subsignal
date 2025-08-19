import TurndownService from 'turndown';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { diffLines } from 'diff';
import { Change, MarkdownDiffResult } from '@/types/diff/markdown';

/**
 * MarkdownDiffService returns an enriched diff representation for HTML contents
 * It takes two HTML strings, converts it to markdown and returns a diff string
 * with line numbers and context.
 */
export class MarkdownDiffService {
    private static instance: MarkdownDiffService;
    private turndown: TurndownService;
    private remarkOptions: any;

    private constructor(turndownOptions: any = {}, remarkOptions: any = {}) {
        // Configure Turndown with sane defaults for diffs
        this.turndown = new TurndownService({
            headingStyle: 'atx',
            hr: '---',
            bulletListMarker: '-',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
            strongDelimiter: '**',
            linkStyle: 'inlined',
            linkReferenceStyle: 'full',
            ...turndownOptions,
        });

        // Remove noisy tags
        this.turndown.remove(['script', 'style', 'iframe', 'noscript']);

        // Store remark options for normalization
        this.remarkOptions = {
            bullet: '-',
            fences: true,
            emphasis: '*',
            strong: '*',
            ...remarkOptions,
        };
    }

    /**
     * Get the singleton instance of MarkdownDiffService
     */
    public static getInstance(
        turndownOptions: any = {},
        remarkOptions: any = {},
    ): MarkdownDiffService {
        if (!MarkdownDiffService.instance) {
            MarkdownDiffService.instance = new MarkdownDiffService(turndownOptions, remarkOptions);
        }
        return MarkdownDiffService.instance;
    }

    /**
     * Convert raw HTML to clean, normalized Markdown with error handling.
     */
    private async htmlToMarkdown(html: string): Promise<string> {
        try {
            const rawMarkdown = this.turndown.turndown(html);

            const processed = await unified()
                .use(remarkParse)
                .use(remarkStringify, this.remarkOptions)
                .process(rawMarkdown);

            return processed.toString().trim();
        } catch (error) {
            console.warn('HTML conversion failed, using fallback:', error);
            // Fallback: strip HTML tags and return plain text
            return html
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }
    }

    /**
     * Create a diff with context lines for better LLM understanding.
     */
    public async diff(
        oldHtml: string,
        newHtml: string,
        contextLines: number = 3,
    ): Promise<MarkdownDiffResult> {
        try {
            const [oldMd, newMd] = await Promise.all([
                this.htmlToMarkdown(oldHtml),
                this.htmlToMarkdown(newHtml),
            ]);

            const oldLines = oldMd.split('\n');
            const newLines = newMd.split('\n');
            const changes: Change[] = diffLines(oldMd, newMd);

            let diffOutput = '--- old\n+++ new\n';
            let currentLine = 0;

            for (let i = 0; i < changes.length; i++) {
                const part = changes[i];

                // If this is a change (not context), include surrounding context
                if (part.added || part.removed) {
                    // Add context before the change
                    if (i > 0 && !changes[i - 1].added && !changes[i - 1].removed) {
                        const contextBefore = changes[i - 1].value
                            .split('\n')
                            .slice(-contextLines)
                            .filter((line) => line !== '');

                        contextBefore.forEach((line) => {
                            diffOutput += ` ${line}\n`;
                        });
                    }

                    // Add the change itself
                    const sign = part.added ? '+' : part.removed ? '-' : ' ';
                    const lines = part.value
                        .split('\n')
                        .filter((line, idx, arr) => line !== '' || idx < arr.length - 1);

                    lines.forEach((line) => {
                        diffOutput += `${sign}${line}\n`;
                    });

                    // Add context after the change
                    if (
                        i < changes.length - 1 &&
                        !changes[i + 1].added &&
                        !changes[i + 1].removed
                    ) {
                        const contextAfter = changes[i + 1].value
                            .split('\n')
                            .slice(0, contextLines)
                            .filter((line) => line !== '');

                        contextAfter.forEach((line) => {
                            diffOutput += ` ${line}\n`;
                        });
                    }
                }
            }

            const changeCount = changes.filter((c) => c.added || c.removed).length;

            return {
                diff: diffOutput.trim(),
                oldMarkdown: oldMd,
                newMarkdown: newMd,
                changeCount,
                hasChanges: changeCount > 0,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            return {
                diff: `Error generating diff with context: ${errorMessage}`,
                oldMarkdown: '',
                newMarkdown: '',
                changeCount: 0,
                hasChanges: false,
                error: errorMessage,
            };
        }
    }
}
