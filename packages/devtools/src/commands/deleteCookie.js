export default async function deleteCookie ({ name }) {
    const page = this.getPageHandle()
    const cookies = await page.cookies()
    const cookieToDelete = cookies.find((cookie) => cookie.name === name)

    if (cookieToDelete) {
        await page.deleteCookie(cookieToDelete)
    }

    return null
}
