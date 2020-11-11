/**
 * The Delete Cookie command allows you to delete either a single cookie by parameter name,
 * or all the cookies associated with the active document's address if name is undefined.
 *
 * @alias browser.deleteCookie
 * @see https://w3c.github.io/webdriver/#dfn-delete-cookie
 * @param {string} name  name of the cookie to delete
 */
import type DevToolsDriver from '../devtoolsdriver'

export default async function deleteCookie (
    this: DevToolsDriver,
    { name }: { name: string }
) {
    const page = this.getPageHandle()
    if (!page) {
        throw new Error('Couldn\'t find page')
    }

    const cookies = await page.cookies()
    const cookieToDelete = cookies.find((cookie) => cookie.name === name)

    if (cookieToDelete) {
        await page.deleteCookie(cookieToDelete)
    }

    return null
}
