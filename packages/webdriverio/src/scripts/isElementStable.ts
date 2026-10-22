/**
 * check if element is stable (an element is considered unstable when it is animating/moving)
 * @param  {HTMLElement} elem  element to check
 * @return {Promise<boolean>}
 */
export default async function isElementStable(elem: HTMLElement): Promise<boolean> {
    /**
     * A WebDriver BiDi session gives a script an element that the page removed, or (in
     * Firefox) an element of the document of a page that was navigated away from, where a
     * WebDriver Classic session fails with a stale element error. Fail the same way, so the
     * element is found again instead of being checked as a removed node
     */
    if ((typeof elem.isConnected === 'boolean' && !elem.isConnected) || (elem.ownerDocument && elem.ownerDocument !== document)) {
        throw new Error('stale element reference: element is not attached to the page document')
    }
    if (document.visibilityState === 'hidden') {
        throw Error('You are checking for animations on an inactive tab, animations do not run for inactive tabs')
    }

    try {
        const previousPosition = elem.getBoundingClientRect()
        /**
         * Two animation frames, or 100ms when the browser renders no frames for
         * this document (Chromium throttles cross-origin frames it doesn't
         * render). Without rendering, nothing can animate either.
         */
        await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, 100)
            requestAnimationFrame(() => requestAnimationFrame(() => {
                clearTimeout(timer)
                resolve()
            }))
        })
        const currentPosition = elem.getBoundingClientRect()
        for (const prop in previousPosition) {
            if (previousPosition[(prop as keyof DOMRect)] !== currentPosition[(prop as keyof DOMRect)]) {
                return false
            }
        }
        return true
    } catch {
        return false
    }
}
