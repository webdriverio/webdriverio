import requestScript from '../../scripts/request.js'
import type { RequestParams, RequestObject } from '../../types'

const REQUEST_PARAM_DEFAULTS: RequestParams = {
    useFetch: true
}

/**
 * tbd
 *
 * <example>
    :request.js
    it('some testing here', async () => {
        // foobar
    });
 * </example>
 *
 * @alias browser.request
 * @param {String} url  request url
 * @param {RequestParams} options  request params
 *
 */
export default async function request (
    this: WebdriverIO.Browser,
    url: string,
    params: RequestParams = REQUEST_PARAM_DEFAULTS
): Promise<RequestObject> {
    if (typeof url !== 'string') {
        throw new Error(`request command expects url from type string but found "${typeof url}"`)
    }

    if (params.useFetch) {
        const result: RequestObject = await this.executeAsync(
            requestScript,
            url,
            params
        )
        return result
    }

    return {}
}
