/**
 *
 * Determine an element’s location on the page. The point (0, 0) refers to
 * the upper-left corner of the page.
 *
 * <example>
    :getLocation.js
    it('should get the location of one or multiple elements', function () {
        browser.url('http://github.com');

        var location = browser.getLocation('.octicon-mark-github');
        console.log(location); // outputs: { x: 150, y: 20 }

        var xLocation = browser.getLocation('.octicon-mark-github', 'x')
        console.log(xLocation); // outputs: 150

        var yLocation = browser.getLocation('.octicon-mark-github', 'y')
        console.log(yLocation); // outputs: 20
    });
 * </example>
 *
 * @alias browser.getLocation
 * @param {String} selector    element with requested position offset
 * @param {String} property    can be "x" or "y" to get a result value directly for easier assertions
 * @return {Object|Object[]}  The X and Y coordinates for the element on the page (`{x:number, y:number}`)
 * @uses protocol/elements, protocol/elementIdLocation
 * @type property
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let getLocation = function (selector, prop) {
    return this.elements(selector).then((res) => {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new CommandError(7, selector || this.lastResult.selector)
        }

        let results = []
        let that = this
        return new Promise((resolve, reject) => {
            let hasError = false

            function processNext () {
                let current = res.value.pop()

                return that
                    .elementIdLocation(current.ELEMENT)
                    .catch((err) => {
                        hasError = true
                        reject(err)
                    })
                    .then((location) => {
                        if (hasError) {
                            return
                        }

                        if (prop === 'x' || prop === 'y') {
                            results.push(location.value[prop])
                        } else {
                            results.push({
                                x: location.value.x,
                                y: location.value.y
                            })
                        }

                        if (res.value.length) {
                            return processNext()
                        } else {
                            resolve((results.length === 1) ? results[0] : results)
                        }
                    })
            }

            return processNext()
        })
    })
}

export default getLocation
