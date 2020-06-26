/**
 * Resets all information stored in the `mock.calls` array.
 *
 * <example>
    :addValue.js
    it('should demonstrate the addValue command', () => {
        const mock = browser.network.mock('https://google.com/')
        browser.url('https://google.com')

        console.log(mock.calls.length) // returns 1
        mock.clear()
        console.log(mock.calls.length) // returns 0
    })
 * </example>
 *
 * @alias mock.clear
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
