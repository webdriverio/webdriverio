export default async function getTitle () {
    const page = this.getPageHandle({ frame: true })
    return page.title()
}
