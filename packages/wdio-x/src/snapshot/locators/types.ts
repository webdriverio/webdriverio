/**
 * Type definitions for mobile element locator generation
 */

export interface ElementAttributes {
    // Android attributes
    'resource-id'?: string;
    'content-desc'?: string;
    text?: string;
    class?: string;
    package?: string;
    clickable?: string;
    'long-clickable'?: string;
    focusable?: string;
    checkable?: string;
    scrollable?: string;
    enabled?: string;
    displayed?: string;
    bounds?: string; // Format: "[x1,y1][x2,y2]"

    // iOS attributes
    type?: string;
    name?: string;
    label?: string;
    value?: string;
    accessible?: string;
    visible?: string;
    x?: string;
    y?: string;
    width?: string;
    height?: string;

    // Generic
    [key: string]: string | undefined;
}

export interface JSONElement {
    children: JSONElement[];
    tagName: string;
    attributes: ElementAttributes;
    path: string; // Dot-separated index path for tree traversal
}

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface FilterOptions {
    includeTagNames?: string[]; // Only include these tags (whitelist)
    excludeTagNames?: string[]; // Exclude these tags (blacklist)
    requireAttributes?: string[]; // Must have at least one of these attributes
    minAttributeCount?: number; // Minimum number of non-empty attributes
    fetchableOnly?: boolean; // Only interactable elements
    clickableOnly?: boolean; // Only elements with clickable="true"
    visibleOnly?: boolean; // Only visible/displayed elements
}

export interface UniquenessResult {
    isUnique: boolean;
    index?: number; // 1-based index if not unique
    totalMatches?: number;
}

export type LocatorStrategy =
    | 'accessibility-id'
    | 'id'
    | 'class-name'
    | 'xpath'
    | 'predicate-string'
    | 'class-chain'
    | 'uiautomator'
    | 'text'

export interface LocatorContext {
    sourceXML: string
    parsedDOM: Document | null
    isAndroid: boolean
}

export interface ElementWithLocators {
    tagName: string;
    locators: Record<string, string>;
    text: string;
    contentDesc: string;
    resourceId: string;
    accessibilityId: string;
    label: string;
    value: string;
    className: string;
    clickable: boolean;
    enabled: boolean;
    displayed: boolean;
    bounds: Bounds;
    isInViewport: boolean;
}

export interface GenerateLocatorsOptions {
    platform: 'android' | 'ios';
    viewportSize?: { width: number; height: number };
    filters?: FilterOptions;
    isNative?: boolean;
}
