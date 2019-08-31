export default async function forward () {
    const page = this.getPageHandle()
    await page.goForward()
    return null
}
