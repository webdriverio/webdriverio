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
 * @param {String} selector    element with requested position offset
 * @returns {Object|Object[]}  The X and Y coordinates for the element on the page (`{x:number, y:number}`)
 *
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

        let elementIdLocationCommands = []
        for (let elem of res.value) {
            elementIdLocationCommands.push(this.elementIdLocation(elem.ELEMENT))
        }

        return Promise.all(elementIdLocationCommands)
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

export default getLocation
