export default async function navigateTo ({ url }) {
    const page = this.windows.get(this.currentWindowHandle)
    await page.goto(url)
    return null
}
