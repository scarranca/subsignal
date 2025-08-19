// Properties from preference table enum
export type DiffProperty =
    | 'pricing'
    | 'product'
    | 'customer'
    | 'partnership'
    | 'branding'
    | 'messaging';

export interface DiffAnalysis {
    pricing: string[];
    product: string[];
    customer: string[];
    partnership: string[];
    branding: string[];
    messaging: string[];
}

export type PartialDiffAnalysis = Partial<DiffAnalysis>;

export interface DiffAnalysisOptions {
    properties?: DiffProperty[];
}
