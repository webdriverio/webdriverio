/**
 * check if element is stable (an element is considered unstable when it is animating/moving)
 * @param  {HTMLElement} elem  element to check
 * @return {Promise<boolean>}
 */
export default async function isElementStable(elem: HTMLElement): Promise<boolean> {
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
