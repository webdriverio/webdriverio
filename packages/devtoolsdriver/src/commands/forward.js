export default async function forward () {
    const page = this.windows.get(this.currentWindowHandle)
    await page.goForward()
    return null
}
