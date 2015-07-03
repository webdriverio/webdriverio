/**
 *
 * Determine an element’s location on the page. The point (0, 0) refers to
 * the upper-left corner of the page.
 *
 * <example>
    :getLocation.js
    client
        .url('http://github.com')
        .getLocation('.header-logo-wordmark').then(location) {
            console.log(location); // outputs: { x: 100, y: 200 }
        })
        .getLocation('.header-logo-wordmark', 'x').then(location) {
            console.log(location); // outputs: 100
        })
        .getLocation('.header-logo-wordmark', 'y').then(location) {
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

var Q = require('q'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getLocation (selector, prop) {

    return this.elements(selector).then(function(res) {

        if(!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new ErrorHandler(7);
        }

        var self = this,
            elementIdLocationCommands = [];

        res.value.forEach(function(elem) {
            elementIdLocationCommands.push(self.elementIdLocation(elem.ELEMENT));
        });

        return Q.all(elementIdLocationCommands);

    }).then(function(locations) {

        locations = locations.map(function(location) {

            if(typeof prop === 'string' && prop.match(/(x|y)/)) {
                return location.value[prop];
            }

            return {
                x: location.value.x,
                y: location.value.y
            };

        });

        return locations.length === 1 ? locations[0] : locations;

    });

};