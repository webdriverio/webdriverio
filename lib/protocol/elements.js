/**
 *
 * Search for multiple elements on the page, starting from the document root. The located
 * elements will be returned as a WebElement JSON objects. The table below lists the
 * locator strategies that each server should support. Elements should be returned in
 * the order located in the DOM.
 *
 * The array of elements can be retrieved  using the 'response.value' which is a
 * collection of element ID's and can be accessed in the subsequent commands
 * using the '.ELEMENT' method.
 *
 * @param {String} selector selector to query the elements
 * @returns {Object[]} A list of WebElement JSON objects for the located elements.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#find-elements
 * @type protocol
 *
 */

import findStrategy from '../helpers/findElementStrategy'
import hasElementResult from '../helpers/hasElementResultHelper'
import q from 'q'

let elements = function (selector) {
    let requestPath = '/session/:sessionId/elements'
    let lastPromise = this.lastResult ? q(this.lastResult).inspect() : this.lastPromise.inspect()

    if (lastPromise.state === 'fulfilled' && hasElementResult(lastPromise.value)) {
        if (!selector) {
            let newSelector = Object.assign({}, lastPromise.value)
            /**
             * if last result was an element result transform result into an array
             */
            newSelector.value = Array.isArray(newSelector.value) ? newSelector.value : [newSelector.value]

            /**
             * only return new selector if existing
             * otherwise fetch again for selector
             */
            if (newSelector.value.length === 0) {
                this.lastResult = null
                return elements.call(this, newSelector.selector)
            }

            return newSelector
        }

        /**
         * format xpath selector (global -> relative)
         */
        if (selector.slice(0, 2) === '//') {
            selector = '.' + selector.slice(1)
        }

        var elem = lastPromise.value.value.ELEMENT
        requestPath = `/session/:sessionId/element/${elem}/elements`
    }

    let found = findStrategy(selector)
    return this.requestHandler.create(requestPath, {
        using: found.using,
        value: found.value
    }).then((result) => {
        result.selector = selector
        return result
    }, (err) => {
        if (err.message === 'no such element') {
            return []
        }

        throw err
    })
}

export default elements
