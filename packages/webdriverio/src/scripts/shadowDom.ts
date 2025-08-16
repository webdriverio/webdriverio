/**
 * This function will be stringified and executed in the browser context.
 * It searches for an <iframe> element within any nested Shadow DOM that contains the given URL fragment.
 */
export default function findIframeInShadowDOM(fragment: string): HTMLIFrameElement | null {
    function findIframe(root: ShadowRoot | Document): HTMLIFrameElement | null {
        // Search all iframes in the current root
        const allElements = Array.from(root.querySelectorAll('iframe'))
        for (const el of allElements) {
            if (el instanceof HTMLIFrameElement && el.src.includes(fragment)) {
                return el
            }
        }
        // Recursively search through all shadow hosts
        const shadowHosts = Array.from(root.querySelectorAll('*'))
        for (const host of shadowHosts) {
            const maybeShadowRoot = (host as HTMLElement).shadowRoot
            if (maybeShadowRoot) {
                const result = findIframe(maybeShadowRoot)
                if (result) {return result}
            }
        }

        return null
    }

    return findIframe(document)
}
