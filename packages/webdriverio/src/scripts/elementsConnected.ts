/**
 * Check `isConnected` for many elements in a single round trip instead of one
 * `execute()` call per element. Kept as a separate self-contained function because
 * `browser.execute()` serializes only the passed function's own source text.
 */
export default function elementsConnected (
    elements: HTMLElement[]
): boolean[] {
    return elements.map((element) => element.isConnected)
}
