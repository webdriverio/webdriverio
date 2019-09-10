export default async function refresh () {
    delete this.currentFrame

    let page = this.getPageHandle()
    await page.reload()
    return null
}
