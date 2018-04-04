
/**
 *
 * Switch focus to a particular tab / window.
 *
 * @param {String|RegExp}  urlOrTitleToMatch  String or regular expression that matches the title or url of the page
 *
 * @uses protocol/getWindowHandles, protocol/switchToWindow, protocol/getCurrentUrl, protocol/getTitle
 * @alias browser.switchTab
 * @type window
 *
 */

export default async function switchWindow (urlOrTitleToMatch) {
    /*!
     * parameter check
     */
    if (typeof urlOrTitleToMatch !== 'string' && !(urlOrTitleToMatch instanceof RegExp)) {
        throw new Error('Unsupported parameter for switchWindow, required is "string" or an RegExp')
    }

    const tabs = await this.getWindowHandles()

    for (const tab of tabs) {
        await this.switchToWindow(tab)

        /**
         * check if url matches
         */
        const url = await this.getCurrentUrl()
        if (url.match(urlOrTitleToMatch)) {
            return tab
        }

        /**
         * check title
         */
        const title = await this.getTitle()
        if (title.match(urlOrTitleToMatch)) {
            return tab
        }
    }

    throw new Error(`No window found with title or url matching "${urlOrTitleToMatch}"`)
}
