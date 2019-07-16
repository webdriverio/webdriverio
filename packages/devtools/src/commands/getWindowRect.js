export default async function getWindowRect () {
    const page = this.windows.get(this.currentWindowHandle)
    const viewport = await page.viewport()
    return Object.assign(viewport, { x: 0, y: 0 })
}
