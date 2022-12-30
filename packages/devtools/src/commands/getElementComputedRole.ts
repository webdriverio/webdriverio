import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * Get the computed WAI-ARIA role of an element.
 *
 * @alias browser.getElementComputedRole
 * @see https://w3c.github.io/webdriver/#get-computed-role
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @return {string}           The result of computing the WAI-ARIA role of element.
 */
export default async function getElementComputedRole (
    this: DevToolsDriver,
    { elementId }: { elementId: string }
) {
    const page = this.getPageHandle(true)
    const elementHandle = await this.elementStore.get(elementId)
    const snapshot = await page.accessibility.snapshot({
        root: elementHandle
    })

    if (!snapshot) {
        return 'Ignored'
    }

    return snapshot.role
}
