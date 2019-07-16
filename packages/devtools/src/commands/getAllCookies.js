export default async function getAllCookies () {
    const page = this.windows.get(this.currentWindowHandle)
    return page.cookies()
}
