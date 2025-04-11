import type { local, remote } from 'webdriver'
import type { RequestWithOptions, RespondWithOptions } from './types.js'

type Overwrite<T> = Omit<T extends RequestWithOptions ? remote.NetworkContinueRequestParameters : remote.NetworkContinueResponseParameters, 'request'>

/**
 * parse request or response overwrites to make it compatible with Bidis protocol
 * @param overwrite request or response overwrite
 * @returns object to pass to the protocol
 */
export function parseOverwrite<
    T extends RequestWithOptions | RespondWithOptions
>(
    overwrite: T,
    request: local.NetworkBeforeRequestSentParameters | local.NetworkResponseCompletedParameters
): Overwrite<T> {
    const result: Overwrite<T> = {} as unknown as Overwrite<T>
    if ('body' in overwrite && overwrite.body) {
        const bodyOverwrite = typeof overwrite.body === 'function'
            ? overwrite.body(request as local.NetworkBeforeRequestSentParameters)
            : overwrite.body
        result.body = bodyOverwrite?.type === 'string' || bodyOverwrite?.type === 'base64')
            ? bodyOverwrite
            : typeof bodyOverwrite === 'string'
                ? { type: 'string', value: bodyOverwrite }
                : { type: 'base64', value: Buffer.from(JSON.stringify(bodyOverwrite || '')).toString('base64') }
    }

    if ('headers' in overwrite) {
        const headersOverwrite = typeof overwrite.headers === 'function'
            ? overwrite.headers(request as local.NetworkBeforeRequestSentParameters)
            : overwrite.headers
        result.headers = Object.entries(headersOverwrite || {}).map(([name, value]) => ({
            name,
            value: { type: 'string', value }
        }))
    }

    if ('cookies' in overwrite && overwrite.cookies) {
        const cookieOverwrite = typeof overwrite.cookies === 'function'
            ? overwrite.cookies(request as local.NetworkBeforeRequestSentParameters) || []
            : overwrite.cookies
        result.cookies = cookieOverwrite.map((cookie) => ({
            name: cookie.name,
            value: <remote.NetworkStringValue>{
                type: 'string',
                value: cookie.value
            },
            domain: cookie.domain,
            path: cookie.path,
            expires: cookie.expiry,
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite?.toLowerCase() as remote.NetworkSetCookieHeader['sameSite'],
        }))
    }

    if ('statusCode' in overwrite && overwrite.statusCode) {
        const statusCodeOverwrite = typeof overwrite.statusCode === 'function'
            ? overwrite.statusCode(request as local.NetworkResponseCompletedParameters)
            : overwrite.statusCode
        ;(result as RespondWithOptions).statusCode = statusCodeOverwrite
    }

    if ('method' in overwrite) {
        result.method = typeof overwrite.method === 'function'
            ? overwrite.method(request as local.NetworkBeforeRequestSentParameters)
            : overwrite.method
    }

    if ('url' in overwrite) {
        result.url = typeof overwrite.url === 'function'
            ? overwrite.url(request as local.NetworkBeforeRequestSentParameters)
            : overwrite.url
    }

    return result
}

export function getPatternParam (pattern: URLPattern, key: keyof Omit<remote.NetworkUrlPatternPattern, 'type'>) {
    if (key !== 'pathname' && pattern[key] === '*') {
        return
    }

    if (key === 'port' && pattern.port === '') {
        return pattern.protocol === 'https' ? '443' : '80'
    }

    return pattern[key].replaceAll('*', '\\*')
}
