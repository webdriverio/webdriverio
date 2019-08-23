export default async function refresh () {
    let page = this.getPageHandle()

    /**
     * if reload is not a function we are currently in a frame and need
     * to move back to the page scope
     */
    if (typeof page.reload !== 'function') {
        delete this.currentFrame
        page = this.getPageHandle()
    }

    await page.reload()
    return null
}
