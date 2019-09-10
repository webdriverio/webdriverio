export default async function getTitle () {
    const page = this.getPageHandle(true)
    return page.title()
}
