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
 * @return {Object[]} A list of WebElement JSON objects for the located elements.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#find-elements
 * @type protocol
 *
 */

import q from 'q'

import findStrategy from '../helpers/findElementStrategy'
import hasElementResult from '../helpers/hasElementResultHelper'
import { W3C_ELEMENT_ID } from '../helpers/constants'
import { CommandError } from '../utils/ErrorHandler'

let elements = function (selector) {
    let requestPath = '/session/:sessionId/elements'
    let lastPromise = this.lastResult ? q(this.lastResult).inspect() : this.lastPromise.inspect()
    let relative = false
    const elementResult = hasElementResult(lastPromise.value)

    if (lastPromise.state === 'fulfilled' && elementResult) {
        if (!selector) {
            let newSelector = Object.assign({}, lastPromise.value)
            /**
             * if last result was an element result transform result into an array
             */
            newSelector.value = Array.isArray(newSelector.value)
                ? newSelector.value : newSelector.value !== null
                    ? [newSelector.value] : []

            /**
             * Only return new selector if existing otherwise fetch again for selector.
             * This is important in cases you do a waitForExist and use the same element
             * variable again after the element has appeared.
             */
            if (newSelector.value.length === 0) {
                this.lastResult = null
                return elements.call(this, newSelector.selector)
            }

            return newSelector
        }

        /**
         * only run elementIdElement if lastPromise was an element command
         */
        if (elementResult === 1) {
            if (lastPromise.value.value === null) {
                throw new CommandError(7, lastPromise.value.selector)
            }

            /**
             * format xpath selector (global -> relative)
             */
            if (selector.slice(0, 2) === '//') {
                selector = '.' + selector.slice(1)
            }

            var elem = lastPromise.value.value.ELEMENT
            relative = true
            requestPath = `/session/:sessionId/element/${elem}/elements`
        }
    }

    let found = findStrategy(selector, relative)
    return this.requestHandler.create(requestPath, {
        using: found.using,
        value: found.value
    }).then((result) => {
        result.selector = selector

        /**
         * W3C webdriver protocol has changed element identifier from `ELEMENT` to
         * `element-6066-11e4-a52e-4f735466cecf`. Let's make sure both identifier
         * are supported.
         */
        result.value = result.value.map((elem) => {
            const elemValue = elem.ELEMENT || elem[W3C_ELEMENT_ID]
            return {
                ELEMENT: elemValue,
                [W3C_ELEMENT_ID]: elemValue
            }
        })

        return result
    }, (err) => {
        if (err.message === 'no such element') {
            return []
        }

        throw err
    })
}

export default elements
