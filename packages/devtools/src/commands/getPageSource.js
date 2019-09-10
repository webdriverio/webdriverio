export default function getPageSource () {
    const page = this.getPageHandle({ isInFrame: true })
    return page.content()
}
