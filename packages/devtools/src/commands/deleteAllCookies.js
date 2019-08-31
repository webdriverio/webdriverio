export default async function deleteAllCookies () {
    const page = this.getPageHandle()
    const cookies = await page.cookies()

    for (const cookie of cookies) {
        await page.deleteCookie(cookie)
    }

    return null
}
