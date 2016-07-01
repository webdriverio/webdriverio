/**
 *
 * Determine an element’s location on the screen once it has been scrolled into view.
 *
 * <example>
    :getLocationInView.js
    client
        .url('http://github.com')
        .getLocationInView('.header-logo-wordmark').then(function(location) {
            console.log(location); // outputs: { x: 100, y: 200 }
        })
        .getLocationInView('.header-logo-wordmark', 'x').then(function(location) {
            console.log(location); // outputs: 100
        })
        .getLocationInView('.header-logo-wordmark', 'y').then(function(location) {
            console.log(location); // outputs: 200
        }):
 * </example>
 *
 * @alias browser.getLocationInView
 * @param {String} selector    element with requested position offset
 * @returns {Object|Object[]}  The X and Y coordinates for the element on the page (`{x:number, y:number}`)
 *
 * @uses protocol/elements, protocol/elementIdLocationInView
 * @type property
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let getLocationInView = function (selector, prop) {
    return this.elements(selector).then((res) => {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new CommandError(7)
        }

        let elementIdLocationInViewCommands = []
        for (let elem of res.value) {
            elementIdLocationInViewCommands.push(this.elementIdLocationInView(elem.ELEMENT))
        }

        return Promise.all(elementIdLocationInViewCommands)
    }).then((locations) => {
        locations = locations.map((location) => {
            if (typeof prop === 'string' && prop.match(/(x|y)/)) {
                return location.value[prop]
            }

            return {
                x: location.value.x,
                y: location.value.y
            }
        })

        return locations.length === 1 ? locations[0] : locations
    })
}

export default getLocationInView
