export default async function refresh () {
    const page = this.windows.get(this.currentWindowHandle)
    await page.reload()
    return null
}
