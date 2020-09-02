/**
 * The Add Cookie command adds a single cookie to the cookie store
 * associated with the active document's address.
 *
 * @alias browser.addCookie
 * @see https://w3c.github.io/webdriver/#dfn-adding-a-cookie
 * @param {object} cookie  A JSON object representing a cookie. It must have at least the name and value fields and could have more, including expiry-time and so on
 */

export default async function addCookie({ cookie }) {
    const page = this.windows.get(this.currentWindowHandle)

    const cookieProps = Object.keys(cookie)
    if (!cookieProps.includes('name') || !cookieProps.includes('value')) {
        throw new Error(
            'Provided cookie object is missing either "name" or "value" property'
        )
    }

    if (typeof cookie.value !== 'string') {
        cookie.value = cookie.value.toString()
    }

    await page.setCookie(cookie)
    return null
}
