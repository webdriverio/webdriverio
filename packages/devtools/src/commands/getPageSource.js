export default function getPageSource () {
    const page = this.getPageHandle({ frame: true })
    return page.content()
}
