export default async function getNamedCookie ({ name }) {
    const page = this.windows.get(this.currentWindowHandle)
    const cookies = await page.cookies()
    return cookies.find((cookie) => cookie.name === name)
}
