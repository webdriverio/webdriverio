export default async function navigateTo (params) {
    const page = this.windows.get(this.currentWindowHandle)
    await page.goto(params.url)
    return null
}
