export default async function getElementAttribute () {
    const page = this.windows.get(this.currentWindowHandle)
    return page.cookies()
}
