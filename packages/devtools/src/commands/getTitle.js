export default async function getTitle () {
    const page = this.getPageHandle()
    return page.title()
}
