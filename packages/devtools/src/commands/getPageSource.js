export default function getPageSource () {
    const page = this.windows.get(this.currentWindowHandle)
    return page.content()
}
