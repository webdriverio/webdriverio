/**
 * Only change request parameter once with given overwrite for the next request. You can call `requestOnce` multiple
 * consecutive times and it will apply the overwrites in order. If you only use `requestOnce` and the resource is called
 * more times a mock has been defined than it defaults back to the original resource.
 *
 * <example>
    :respond.js
    it('adds different auth headers to my API requests', async () => {
        const mock = await browser.mock('https://application.com/api', {
            method: 'get'
        })

        mock.requestOnce({
            headers: { 'Authorization': 'Bearer token' }
        })
        mock.requestOnce({
            headers: { 'Authorization': 'Another bearer token' }
        })

        await browser.url('https://application.com')
        // ...
    })
 * </example>
 *
 * @alias mock.requestOnce
 * @param {MockOverwrite}          overwrites            payload to overwrite the response
 * @param {`Record<string, string>`} overwrites.header     overwrite specific headers
 * @param {`Record<string, string>`} overwrites.cookies    overwrite request cookies
 * @param {string}                 overwrites.method     overwrite request method
 * @param {string}                 overwrites.url        overwrite request url to initiate a redirect
 * @param {MockResponseParams=}    params                additional respond parameters to overwrite
 * @param {Object=}                params.header         overwrite specific headers
 * @param {Number=}                params.statusCode     overwrite response status code
 * @param {Boolean=}               params.fetchResponse  fetch real response before responding with mocked data
 */
// actual implementation is located in packages/webdriverio/src/utils/interception
