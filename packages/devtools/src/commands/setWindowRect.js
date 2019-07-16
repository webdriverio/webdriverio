export default async function setWindowRect (params) {
    const page = this.windows.get(this.currentWindowHandle)
    await page.setViewport(params)
    return { width: params.width, height: params.height }
}
