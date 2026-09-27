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
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
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
