/**
 *
 * Retrieve a list of all window handles available in the session.
 *
 * @alias browser.getTabIds
 * @returns {String[]} a list of window handles
 * @uses protocol/windowHandles
 * @type window
 *
 */

let getTabIds = function () {
    return this.unify(this.windowHandles(), {
        extractValue: true
    })
}

export default getTabIds
