export default async function getUrl () {
    const page = this.getPageHandle({ frame: true })
    return page.url()
}
