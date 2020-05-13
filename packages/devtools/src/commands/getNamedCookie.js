/**
 * 
 * The Get Named Cookie command returns the cookie with the requested name from the 
 * associated cookies in the cookie store of the current browsing context's active document. 
 * If no cookie is found, a no such cookie error is returned.
 * 
 */

export default async function getNamedCookie ({ name }) {
    const page = this.getPageHandle()
    const cookies = await page.cookies()
    const cookie = cookies.find((cookie) => cookie.name === name)

    if (!cookie) {
        throw new Error(`No cookie with name ${name}`)
    }

    return cookie
}
