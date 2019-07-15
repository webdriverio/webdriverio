export default async function back () {
    const page = this.windows.get(this.currentWindowHandle)
    await page.goBack()
    return null
}
