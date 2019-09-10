export default async function refresh () {
    delete this.currentFrame

    const page = this.getPageHandle()
    await page.reload()
    return null
}
