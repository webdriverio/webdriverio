/**
 * The print functions are a mechanism to render the document to a paginated format.
 *
 * @alias browser.printPage
 * @see https://w3c.github.io/webdriver/#print
 * @param {object} options an object of options that affect the pdf output
 */

import DevToolsDriver from '../devtoolsdriver'

export default async function printPage(this: DevToolsDriver, options: any) {
    const page = this.getPageHandle()
    if (!options) {
        return page.pdf()
    }

    return page.pdf({
        landscape: options.orientation === 'landscape',
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