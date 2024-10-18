/**
 * Sets up a redirect for a given mock. This allows you to redirect a request to another URL.
 * Note: these redirects only apply to requests made by a script in the browser, not when calling the `url` command.
 *
 * <example>
    :respond.js
    it('redirects all my API request to my staging server', async () => {
        const mock = await browser.mock('https://application.com/api/*')
        mock.redirect('https://staging.application.com/api/*')

        // is the same as
        mock.request({ url: 'https://staging.application.com/api/*' })

        // ...
    })
 * </example>
 *
 * @alias mock.request
 * @param {string} url  target resource to redirect requests to
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
