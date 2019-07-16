export default async function deleteCookie ({ name }) {
    const page = this.windows.get(this.currentWindowHandle)
    const cookies = await page.cookies()
    const cookieToDelete = cookies.find((cookie) => cookie.name === name)

    if (cookieToDelete) {
        await page.deleteCookie(cookieToDelete)
    }

    return null
}
