export default function getElementCSSValue (_: HTMLElement, elem: HTMLElement, propertyName: string, pseudoElement?: string | null): string {
    /**
     * Have to cast to any due to https://github.com/Microsoft/TypeScript/issues/17827
     */
    return (window.getComputedStyle(elem, pseudoElement) as any)[propertyName]
}
