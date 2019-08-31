export default async function getAllCookies () {
    const page = this.getPageHandle()
    return page.cookies()
}
