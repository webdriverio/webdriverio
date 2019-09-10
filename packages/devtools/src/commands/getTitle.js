export default async function getTitle () {
    const page = this.getPageHandle({ isInFrame: true })
    return page.title()
}
