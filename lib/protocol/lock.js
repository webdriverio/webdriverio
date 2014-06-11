/**
 *
 * lock screen (Appium specific command)
 *
 */

module.exports = function lock(seconds) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(typeof seconds !== 'number') {
        seconds = 0;
    }

    var requestOptions = {
        path: '/session/:sessionId/appium/device/lock',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, { seconds: seconds }, callback);

};