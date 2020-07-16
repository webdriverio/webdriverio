/**
 * > This is a __beta__ feature. Please give us feedback and file [an issue](https://github.com/webdriverio/webdriverio/issues/new/choose) if certain scenarions don't work as expected!
 *
 * Does everything that `mock.clear()` does, and also removes any mocked return values or implementations.
 *
 * <example>
    :addValue.js
    it('should demonstrate the addValue command', () => {
        const mock = browser.mock('**\/googlelogo_color_272x92dp.png')
        mock.respond('https://webdriver.io/img/webdriverio.png')
        browser.url('https://google.com') // shows WebdriverIO logo instead of Google

        mock.restore()
        browser.url('https://google.com') // shows normal Google logo again
    })
 * </example>
 *
 * @alias mock.restore
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
