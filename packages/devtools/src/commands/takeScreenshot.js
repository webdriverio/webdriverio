export default async function takeScreenshot () {
    const page = this.windows.get(this.currentWindowHandle)
    return page.screenshot({
        encoding: 'base64',
        fullPage: true,
        type: 'png'
    })
}
