export default async function back () {
    delete this.currentFrame
    const page = this.getPageHandle()
    await page.goBack()
    return null
}
