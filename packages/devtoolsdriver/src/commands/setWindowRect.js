export default async function setWindowRect (params) {
    const page = this.windows.get(this.currentWindowHandle)
    await page.setViewport(params)
    return null
}
