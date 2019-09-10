export default function getPageSource () {
    const page = this.getPageHandle(true)
    return page.content()
}
