/**
 * Allows you do modify requests the browser makes during the session. This can be useful for the following use cases:
 *
 * - validating if your application sends correct request payloads
 * - passing through authorization headers to test protected resources
 * - setting session cookies to test user authentication
 * - modifying requests to test edge cases
 *
 * <example>
    :respond.js
    it('adds an auth header to my API requests', async () => {
        const mock = await browser.mock('https://application.com/api', {
            method: 'get'
        })

        mock.request({
            headers: { 'Authorization': 'Bearer token' }
        })

        await browser.url('https://application.com')
        // ...
    })
 * </example>
 *
 * @alias mock.request
 * @param {MockOverwrite}          overwrites            payload to overwrite the response
 * @param {`Record<string,string>`} overwrites.header     overwrite specific headers
 * @param {`Record<string,string>`} overwrites.cookies    overwrite request cookies
 * @param {string}                 overwrites.method     overwrite request method
 * @param {string}                 overwrites.url        overwrite request url to initiate a redirect
 * @param {MockResponseParams=}    params                additional respond parameters to overwrite
 * @param {Object=}                params.header         overwrite specific headers
 * @param {Number=}                params.statusCode     overwrite response status code
 * @param {Boolean=}               params.fetchResponse  fetch real response before responding with mocked data
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
