import type { local, remote } from 'webdriver'
import type { RequestWithOptions, RespondWithOptions } from './types.js'

/**
 * parse request or response overwrites to make it compatible with Bidis protocol
 * @param overwrite request or response overwrite
 * @returns object to pass to the protocol
 */
export function parseOverwrite(overwrite: RequestWithOptions | RespondWithOptions, request: local.NetworkBeforeRequestSentParameters | local.NetworkResponseCompletedParameters) {
    let body: remote.NetworkBytesValue | undefined = undefined
    if ('body' in overwrite && overwrite.body) {
        const bodyOverwrite = typeof overwrite.body === 'function'
            ? overwrite.body(request as local.NetworkBeforeRequestSentParameters)
            : overwrite.body
        body = typeof bodyOverwrite === 'string' ?
            /**
             * if body is a string we can pass it as is
             */
            {
                type: 'string',
                value: bodyOverwrite
            }
            :
            /**
             * if body is an object we need to encode it
             */
            {
                type: 'base64',
                value: globalThis.Buffer
                    ? globalThis.Buffer.from(JSON.stringify(bodyOverwrite || '')).toString('base64')
                    : btoa(JSON.stringify(bodyOverwrite))
            }
    }

    let headers: remote.NetworkHeader[] = []
    const headersOverwrite = typeof overwrite.headers === 'function'
        ? overwrite.headers(request as local.NetworkBeforeRequestSentParameters)
        : overwrite.headers
    if (headersOverwrite) {
        headers = Object.entries(headersOverwrite).map(([name, value]) => ({
            name,
            value: { type: 'string', value }
        }))
    }

    let cookies: remote.NetworkSetCookieHeader[] = []
    if ('cookies' in overwrite && overwrite.cookies) {
        const cookieOverwrite = typeof overwrite.cookies === 'function'
            ? overwrite.cookies(request as local.NetworkBeforeRequestSentParameters) || []
            : overwrite.cookies
        cookies = cookieOverwrite.map((cookie) => ({
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

    let statusCode: number | undefined = undefined
    if ('statusCode' in overwrite && overwrite.statusCode) {
        const statusCodeOverwrite = typeof overwrite.statusCode === 'function'
            ? overwrite.statusCode(request as local.NetworkResponseCompletedParameters)
            : overwrite.statusCode
        statusCode = statusCodeOverwrite
    }

    const method: string | undefined = 'method' in overwrite
        ? typeof overwrite.method === 'function'
            ? overwrite.method(request as local.NetworkBeforeRequestSentParameters)
            : overwrite.method
        : undefined

    const url = 'url' in overwrite
        ? typeof overwrite.url === 'function'
            ? overwrite.url(request as local.NetworkBeforeRequestSentParameters)
            : overwrite.url
        : undefined
    return { body, headers, cookies, method, statusCode, url }
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
