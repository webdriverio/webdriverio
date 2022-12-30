import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Get Named Cookie command returns the cookie with the requested name from the
 * associated cookies in the cookie store of the current browsing context's active document.
 * If no cookie is found, a no such cookie error is returned.
 *
 * @alias browser.getNamedCookie
 * @see https://w3c.github.io/webdriver/#dfn-get-named-cookie
 * @param {string} name  name of the cookie to retrieve
 * @return {object}      A serialized cookie, with name and value fields. There are a number of optional fields like `path`, `domain`, and `expiry-time` which may also be present.
 */
export default async function getNamedCookie (
    this: DevToolsDriver,
    { name }: { name: string }
) {
    const page = this.getPageHandle()
    const cookies = await page.cookies()
    const cookie = cookies.find((cookie) => cookie.name === name)

    if (!cookie) {
        throw new Error(`No cookie with name ${name}`)
    }

    return cookie
}
