/**
 * Wait until at least one matching request has received a response.
 *
 * <example>
    :waitForResponse.js
    it('should wait for a matching response', async () => {
        const mock = await browser.mock('**' + '/users/list')

        // trigger action that issues the request
        await $('#load').click()

        await mock.waitForResponse({ timeout: 5000 })
        expect(mock.calls.length).toBeGreaterThan(0)
    })
 * </example>
 *
 * @alias mock.waitForResponse
 * @param {WaitForOptions=}  options                 wait options
 * @param {Number=}          options.timeout         max wait time in ms (defaults to `browser.options.waitforTimeout`)
 * @param {Number=}          options.interval        poll interval in ms (defaults to `browser.options.waitforInterval`)
 * @param {String=}          options.timeoutMsg      custom timeout error message
 */
// actual implementation is located in packages/webdriverio/src/utils/interception


