/**
 * 
 * The Delete Cookie command allows you to delete either a single cookie by parameter name, 
 * or all the cookies associated with the active document's address if name is undefined.
 * 
 */

export default async function deleteCookie ({ name }) {
    const page = this.getPageHandle()
    const cookies = await page.cookies()
    const cookieToDelete = cookies.find((cookie) => cookie.name === name)

    if (cookieToDelete) {
        await page.deleteCookie(cookieToDelete)
    }

    return null
}
