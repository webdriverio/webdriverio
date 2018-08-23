/**
 *
 * Get the element on the page that currently has focus. The element will be returned as a WebElement JSON object.
 *
 * @return {String} A WebElement JSON object for the active element.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#get-active-element
 * @type protocol
 *
 */

import { isUnknownCommand } from '../helpers/utilities'

export default function elementActive () {
    const requestOptions = {
        path: '/session/:sessionId/element/active',
        method: 'POST'
    }

    return this.requestHandler.create(requestOptions).catch((err) => {
        /**
         * jsonwire command not supported try webdriver endpoint
         */
        if (isUnknownCommand(err)) {
            requestOptions.method = 'GET'
            return this.requestHandler.create(requestOptions)
        }

        throw err
    })
}
