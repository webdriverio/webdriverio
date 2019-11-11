export default async function navigateTo ({ url }) {
    /*
     * when navigating to a new url get out of frame scope
     */
    delete this.currentFrame

    const page = this.getPageHandle()
    await page.goto(url)
    return null
}
