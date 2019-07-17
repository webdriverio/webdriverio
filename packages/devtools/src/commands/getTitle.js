export default async function getTitle () {
    const page = this.windows.get(this.currentWindowHandle)
    return page.title()
}
