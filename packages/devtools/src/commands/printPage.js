import DevToolsDriver from '../devtoolsdriver'

export default async function printPage(options) {
    const page = DevToolsDriver.getPageHandle()
    if (!options) {
        return page.pdf()
    }

    return page.pdf({
        landscaper: options.orientation,
        scale: options.scale,
        printBackground: options.background,
        width: options.width,
        height: options.height,
        margin: {
            top: options.top,
            right: options.right,
            bottom: options.bottom,
            left: options.left
        },
        preferCSSPageSize: !options.shrinkToFit,
        pageRanges: options.pageRanges
    })

}