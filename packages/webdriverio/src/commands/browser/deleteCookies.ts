/**
 * Delete cookies visible to the current page. By providing a cookie name it
 * just removes the single cookie or more when multiple names are passed.
 *
 * @alias browser.deleteCookies
 * @param {String | String[]} names  names of cookies to be deleted
 * @uses webdriver/deleteAllCookies,webdriver/deleteCookie
 * @example https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/deleteCookies/example.js#L9-L29
 * @example https://github.com/webdriverio/example-recipes/blob/e8b147e88e7a38351b0918b4f7efbd9ae292201d/deleteCookies/example.js#L31-L35
 */
export function deleteCookies(
    this: WebdriverIO.Browser,
    names?: string | string[]
) {
    if (names === undefined) {
        return this.deleteAllCookies()
    }

    const namesList = Array.isArray(names) ? names : [names]

    if (namesList.every(obj => typeof obj !== 'string')) {
        return Promise.reject(new Error('Invalid input (see https://webdriver.io/docs/api/browser/deleteCookies for documentation)'))
    }

    return Promise.all(namesList.map(name => this.deleteCookie(name)))
}
