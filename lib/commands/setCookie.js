/**
 *
 * Sets a [cookie](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object)
 * for current page.
 *
 * <example>
    :getCookie.js
    client
        .setCookie({name: 'test', value: '123'})
        .getCookie().then(function(cookies) {
            console.log(cookies); // outputs: [{ name: 'test', value: '123' }]
        })
 * </example>
 *
 * @param {Object} cookie cookie object
 *
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
        throw new CommandError('Please specify a cookie object to set (see http://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object for documentation.')
    }

    return this.cookie('POST', cookieObj)
}

export default setCookie
