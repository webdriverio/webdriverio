/**
 * check if element is stable (an element is considered unstable when it is animating/moving)
 * @param  {HTMLElement} elem  element to check
 * @param  {Function} done     callback function to be called when done
 * @return {void}
 */
export default function isElementStable(elem: HTMLElement, done: (returnValue: boolean) => void) {
    if (document.visibilityState === 'hidden') {
        throw Error('You are are checking for animations on an inactive tab, animations do not run for inactive tabs')
    }
    try {
        const previousPosition = elem.getBoundingClientRect()
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const currentPosition = elem.getBoundingClientRect()
                for (const prop in previousPosition) {
                    if (previousPosition[(prop as keyof DOMRect)] !== currentPosition[(prop as keyof DOMRect)]) {
                        done(false)
                    }
                }
                done(true)
            })
        })
    } catch (error) {
        done(false)
    }
}