/**
 * 
 * The Get Current URL command returns the URL of the current top-level browsing context
 * 
 */

import command from '../scripts/getUrl'

export default async function getUrl () {
    const page = this.getPageHandle(true)
    return page.$eval('html', command)
}
