export default async function forward () {
    delete this.currentFrame
    const page = this.getPageHandle()
    await page.goForward()
    return null
}
