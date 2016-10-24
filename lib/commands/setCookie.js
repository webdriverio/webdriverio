/**
 *
 * Sets a [cookie](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#cookie-json-object)
 * for current page. Make sure you are on the page that should receive the cookie. You can't set
 * a cookie for an arbitrary page without being on that page.
 *
 * <example>
    :setCookie.js
    it('should set a cookie for the page', function () {
        browser.url('/')
        browser.setCookie({name: 'test', value: '123'});

        var cookies = browser.getCookie();
        console.log(cookies); // outputs: [{ name: 'test', value: '123' }]
    });
 * </example>
 *
 * @alias browser.setCookie
 * @param {Object} cookie cookie object
 * @uses protocol/cookie
 * @type cookie
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let setCookie = function (cookieObj) {
    /*!
     * parameter check
     */
    if (typeof cookieObj !== 'object') {
        throw new CommandError('Please specify a cookie object to set (see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#cookie-json-object for documentation.')
    }

    return this.cookie('POST', cookieObj)
}

export default setCookie
