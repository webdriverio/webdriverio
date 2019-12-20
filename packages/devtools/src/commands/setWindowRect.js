export default async function setWindowRect (params) {
    const page = this.getPageHandle()
    await page.setViewport(params)
    return { width: params.width, height: params.height }
}
