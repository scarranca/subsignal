import { ContentDiffService } from './content';
import { MarkdownDiffService } from './markdown';
import type { DiffAnalysisOptions } from '@/types/diff/content';
import { dump } from 'js-yaml';

/**
 * Service for creating diffs between content
 */
export class DiffService {
    private contentDiffService: ContentDiffService;
    private markdownDiffService: MarkdownDiffService;

    constructor() {
        this.contentDiffService = ContentDiffService.getInstance();
        this.markdownDiffService = MarkdownDiffService.getInstance();
    }

    /**
     * Create a content diff between two HTML contents
     */
    async contentDiff(
        oldHtml: string,
        newHtml: string,
        options?: DiffAnalysisOptions,
    ): Promise<string> {
        const markdownDiff = await this.markdownDiff(oldHtml, newHtml);
        const contentDiff = await this.contentDiffService.diff(markdownDiff, options);
        return dump(contentDiff);
    }

    /**
     * Create a markdown diff between two HTML contents
     */
    async markdownDiff(
        oldHtml: string,
        newHtml: string,
        contextLines: number = 3,
    ): Promise<string> {
        const markdownDiff = await this.markdownDiffService.diff(oldHtml, newHtml, contextLines);
        return markdownDiff.diff;
    }
}
