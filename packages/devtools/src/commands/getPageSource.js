export default function getPageSource () {
    const page = this.getPageHandle()
    return page.content()
}
