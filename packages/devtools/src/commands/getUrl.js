/**
 * The Get Current URL command returns the URL of the current top-level browsing context
 *
 * @alias browser.getUrl
 * @see https://w3c.github.io/webdriver/#dfn-get-current-url
 * @returns {String} current document URL of the top-level browsing context.
 */

import command from '../scripts/getUrl'

export default async function getUrl () {
    const page = this.getPageHandle(true)
    return page.$eval('html', command)
}
