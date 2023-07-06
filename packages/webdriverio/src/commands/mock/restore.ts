/**
 * Does everything that `mock.clear()` does, and also removes any mocked return values or implementations.
 * Restored mock does not emit events and could not mock responses.
 *
 * <example>
    :addValue.js
    it('should demonstrate the addValue command', async () => {
        const mock = await browser.mock('**\/googlelogo_color_272x92dp.png')
        mock.respond('https://webdriver.io/img/webdriverio.png')
        await browser.url('https://google.com') // shows WebdriverIO logo instead of Google

        mock.restore()
        await browser.url('https://google.com') // shows normal Google logo again
    })
 * </example>
 *
 * @alias mock.restore
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
