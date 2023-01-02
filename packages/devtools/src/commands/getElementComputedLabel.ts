import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * Get the computed WAI-ARIA label of an element.
 *
 * @alias browser.getElementComputedLabel
 * @see https://w3c.github.io/webdriver/#get-computed-label
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @return {string}           The result of computing the WAI-ARIA label of element.
 */
export default async function getElementComputedLabel (
    this: DevToolsDriver,
    { elementId }: { elementId: string }
) {
    const page = this.getPageHandle(true)
    const elementHandle = await this.elementStore.get(elementId)
    const snapshot = await page.accessibility.snapshot({
        root: elementHandle
    })

    if (!snapshot) {
        return ''
    }

    return snapshot.name
}
