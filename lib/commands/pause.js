/**
 *
 * pauses queue execution for a specific amount of time
 *
 * <example>
    :pauseAsync.js
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

let pause = function (milliseconds = 1000) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export default pause
