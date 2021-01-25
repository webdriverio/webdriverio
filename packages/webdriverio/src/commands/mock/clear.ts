/**
 * Resets all information stored in the `mock.calls` array.
 *
 * <example>
    :clear.js
    it('should clear mock', () => {
        const mock = browser.mock('https://google.com/')
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
