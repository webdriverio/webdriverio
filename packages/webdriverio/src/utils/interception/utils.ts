import type { local, remote } from 'webdriver'
import { URLPattern } from 'urlpattern-polyfill'

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
        result.body = typeof bodyOverwrite === 'string' ?
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
        const statusCodeOverwrite = (
            typeof overwrite.statusCode === 'function'
                ? overwrite.statusCode(request as local.NetworkResponseCompletedParameters)
                : overwrite.statusCode
        )
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

export function getPatternParam(pattern: URLPattern, key: keyof Omit<remote.NetworkUrlPatternPattern, 'type'>) {
    if (key !== 'pathname' && pattern[key] === '*') {
        return
    }

    if (key === 'port' && pattern.port === '') {
        return pattern.protocol === 'https' ? '443' : '80'
    }

    return pattern[key].replaceAll('*', '\\*')
}

/**
 * Converts a glob pattern to a URLPattern compatible regular expression pattern
 * @param globPattern - The glob pattern to convert
 * @returns A URLPattern instance representing the converted glob pattern
 */
export function globToURLPattern(globPattern: string): URLPattern {
    // Helper function to convert a glob segment to regex
    function convertGlobToRegex(glob: string): string {
        // Step 1: Escape characters that have special meaning in regex
        let regex = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        // Step 2: Convert glob patterns to regex patterns
        // Convert ** (matches any number of directories/segments)
        regex = regex.replace(/\\\*\\\*/g, '.*')

        // Convert * (matches anything within a single segment)
        regex = regex.replace(/\\\*/g, '[^/]*')

        // Convert ? (matches a single character)
        regex = regex.replace(/\\\?/g, '(.)')

        // Handle {a,b,c} expansion patterns
        regex = regex.replace(/\\{([^{}]*)\\}/g, (_, contents: string) => {
        // Split by comma but respect escaped commas
            const options = contents.split(/(?<!\\),/)
                .map(option => option.trim())
                .join('|')
            return `(${options})`
        })

        return regex
    }

    // Parse the glob pattern into URL components
    const patternObj: Record<string, string> = {}

    // Check if the pattern includes a protocol and/or hostname
    const urlRegex = /^([^:/]+:\/{0,2})([^/]*)(.*)$/
    const match = globPattern.match(urlRegex)

    if (match) {
        // We have a full URL pattern with protocol and possibly hostname
        const [, protocol, host, path] = match

        if (protocol) {
            // Handle protocol (e.g., "http*:")
            const protocolClean = protocol.replace(/\/{0,2}$/, '') // Remove trailing slashes
            patternObj.protocol = `${convertGlobToRegex(protocolClean)}`
        }

        if (host) {
            // Handle hostname (e.g., "api.*.example.com")
            patternObj.hostname = `${convertGlobToRegex(host)}`
        }

        if (path) {
            // Handle pathname (starting with /)
            patternObj.pathname = `${convertGlobToRegex(path)}`
        }
    } else {
        // It's just a pathname pattern
        patternObj.pathname = `${convertGlobToRegex(globPattern)}`

        if (patternObj.pathname === '') {
            throw new Error('Invalid URL pattern')
        }
    }

    // Create and return the URLPattern
    return new URLPattern(patternObj)
}
