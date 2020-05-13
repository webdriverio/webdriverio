/**
 * 
 * The Get All Cookies command returns all cookies associated with the address 
 * of the current browsing context’s active document.
 * 
 */

export default async function getAllCookies () {
    const page = this.getPageHandle()
    return page.cookies()
}
