export default async function addCookie ({ cookie }) {
    const page = this.windows.get(this.currentWindowHandle)

    if (!Object.keys(cookie).includes('name') || !Object.keys(cookie).includes('value')) {
        throw new Error('Provided cookie object is missing either "name" or "value" property')
    }

    await page.setCookie(cookie)
    return null
}
