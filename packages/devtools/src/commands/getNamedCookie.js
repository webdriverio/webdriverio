export default async function getNamedCookie ({ name }) {
    const page = this.windows.get(this.currentWindowHandle)
    const cookies = await page.cookies()
    const cookie = cookies.find((cookie) => cookie.name === name)

    if (!cookie) {
        throw new Error(`No cookie with name ${name}`)
    }

    return cookie
}
