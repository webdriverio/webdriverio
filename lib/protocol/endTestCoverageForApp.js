/**
 *
 * end test coverage for app (Appium specific command)
 *
 * ### Usage:
 *
 *     client.endTestCoverageForApp(intent, path)
 *
 */

module.exports = function endTestCoverageForApp(intent, path) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/app/end_test_coverage',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, {intent: intent, path: path}, callback);

};