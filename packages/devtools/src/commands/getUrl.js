export default async function getUrl () {
    const page = this.getPageHandle({ isInFrame: true })
    return page.url()
}
