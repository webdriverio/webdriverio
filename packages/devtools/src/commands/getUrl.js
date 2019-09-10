export default async function getUrl () {
    const page = this.getPageHandle(true)
    return page.url()
}
