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
 * @param {String} selector    element with requested position offset
 * @returns {Object|Object[]}  The X and Y coordinates for the element on the page (`{x:number, y:number}`)
 *
 * @uses protocol/elements, protocol/elementIdLocationInView
 * @type property
 *
 */

var Q = require('q'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getLocationInView (selector, prop) {

    return this.elements(selector).then(function(res) {

        if(!res.value || res.value.length === 0) {
            // throw NoSuchElement error if no element was found
            throw new ErrorHandler(7);
        }

        var self = this,
            elementIdLocationInViewCommands = [];

        res.value.forEach(function(elem) {
            elementIdLocationInViewCommands.push(self.elementIdLocationInView(elem.ELEMENT));
        });

        return Q.all(elementIdLocationInViewCommands);

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