export default async function navigateTo () {
    const page = this.windows.get(this.currentWindowHandle)
    return page.url()
}
