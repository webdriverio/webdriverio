export default async function back () {
    const page = this.getPageHandle()
    await page.goBack()
    return null
}
