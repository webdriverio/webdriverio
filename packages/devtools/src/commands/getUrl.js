export default async function getUrl () {
    const page = this.windows.get(this.currentWindowHandle)
    return page.url()
}
