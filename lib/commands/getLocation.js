/**
 *
 * Determine an element’s location on the page. The point (0, 0) refers to
 * the upper-left corner of the page.
 *
 * <example>
    :getLocation.js
    client
        .url('http://github.com')
        .getLocation('.header-logo-wordmark').then(function (location) {
            console.log(location); // outputs: { x: 100, y: 200 }
        })
        .getLocation('.header-logo-wordmark', 'x').then(function (location) {
            console.log(location); // outputs: 100
        })
        .getLocation('.header-logo-wordmark', 'y').then(function (location) {
            console.log(location); // outputs: 200
        });
 * </example>
 *
 * @alias browser.getLocation
 * @param {String} selector    element with requested position offset
 * @returns {Object|Object[]}  The X and Y coordinates for the element on the page (`{x:number, y:number}`)
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
            throw new CommandError(7)
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
