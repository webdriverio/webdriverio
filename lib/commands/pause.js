/**
 *
 * pauses queue execution for a specific amount of time
 *
 * <example>
    :pause.js
    var starttime = new Date().getTime();

    client
        .pause(3000)
        .call(function() {
            var endtime = new Date().getTime();
            console.log(endtime - starttime); // outputs: 3000
        })
 * </example>
 *
 * @param {Number} milliseconds time in ms
 * @type utility
 *
 */

var Q = require('q');

module.exports = function pause (milliseconds) {
    var defer = Q.defer();
    setTimeout(defer.resolve, milliseconds);
    return defer.promise;
};