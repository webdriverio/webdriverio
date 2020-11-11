/**
 * The Delete All Cookies command allows deletion of all cookies
 * associated with the active document's address.
 *
 * @alias browser.deleteAllCookies
 * @see https://w3c.github.io/webdriver/#dfn-delete-all-cookies
 */
import type DevToolsDriver from '../devtoolsdriver'

export default async function deleteAllCookies (this: DevToolsDriver) {
    const page = this.getPageHandle()
    if (!page) {
        throw new Error('Couldn\'t find page')
    }

    const cookies = await page.cookies()

    for (const cookie of cookies) {
        await page.deleteCookie(cookie)
    }

    return null
}
