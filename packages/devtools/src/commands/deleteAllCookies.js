/**
 * 
 * The Delete All Cookies command allows deletion of all cookies 
 * associated with the active document's address.
 * 
 */

export default async function deleteAllCookies () {
    const page = this.getPageHandle()
    const cookies = await page.cookies()

    for (const cookie of cookies) {
        await page.deleteCookie(cookie)
    }

    return null
}
