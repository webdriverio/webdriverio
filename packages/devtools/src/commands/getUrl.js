export default async function getUrl () {
    const page = this.getPageHandle()
    return page.url()
}
