import type { remote } from 'webdriver'

type UrlPatterns = remote.NetworkUrlPattern[] | undefined

/**
 * The browser answered the command with an error, so it did not change its
 * intercepts. See `BidiCore.send` in the `webdriver` package.
 */
const isBidiError = (err: unknown, code = '') => (
    err instanceof Error && err.message.includes(` failed with error: ${code}`)
)

/**
 * Keep the network intercepts this page registered, with their url patterns,
 * in `window.__wdioNetworkIntercepts__`. A request matching one of them is
 * paused until the page releases it, so the page must not wait for one
 * synchronously. When the outcome of a command is unknown, keep the intercept:
 * a wrong entry only costs source maps, a missing one blocks the page.
 */
export function trackNetworkIntercepts (bidiPrototype: PropertyDescriptorMap) {
    const intercepts = new Map<string | symbol, UrlPatterns>()
    window.__wdioNetworkIntercepts__ = intercepts

    const addIntercept = bidiPrototype.networkAddIntercept?.value
    const removeIntercept = bidiPrototype.networkRemoveIntercept?.value
    if (typeof addIntercept !== 'function' || typeof removeIntercept !== 'function') {
        return
    }

    bidiPrototype.networkAddIntercept = {
        value: async function (this: unknown, params: remote.NetworkAddInterceptParameters, ...args: unknown[]) {
            /**
             * the intercept pauses requests before its id gets back to the page
             */
            const pending = Symbol('pending intercept')
            intercepts.set(pending, params?.urlPatterns)
            try {
                const result = await addIntercept.apply(this, [params, ...args])
                intercepts.delete(pending)
                if (result?.intercept) {
                    intercepts.set(result.intercept, params?.urlPatterns)
                }
                return result
            } catch (err) {
                if (isBidiError(err)) {
                    intercepts.delete(pending)
                }
                throw err
            }
        }
    }
    bidiPrototype.networkRemoveIntercept = {
        value: async function (this: unknown, params: remote.NetworkRemoveInterceptParameters, ...args: unknown[]) {
            try {
                const result = await removeIntercept.apply(this, [params, ...args])
                intercepts.delete(params?.intercept)
                return result
            } catch (err) {
                if (isBidiError(err, 'no such intercept')) {
                    intercepts.delete(params?.intercept)
                }
                throw err
            }
        }
    }
}

const DEFAULT_PORTS: Record<string, string> = { http: '80', https: '443', ws: '80', wss: '443' }

const parseUrl = (url: string, base?: string) => {
    try {
        return new URL(url, base)
    } catch {
        return undefined
    }
}

/**
 * Whether the browser may match `url` with `pattern`. Only the origin is
 * compared, and a value this function cannot compare matches.
 */
function mayMatchUrlPattern (pattern: remote.NetworkUrlPattern, url: URL) {
    let { protocol, hostname, port }: Partial<remote.NetworkUrlPatternPattern> = pattern.type === 'pattern' ? pattern : {}
    if (pattern.type === 'string') {
        const patternUrl = parseUrl(pattern.pattern)
        if (!patternUrl) {
            return true
        }
        ({ protocol, hostname, port } = patternUrl)
    }

    const urlProtocol = url.protocol.slice(0, -1)
    protocol = protocol?.replace(/:$/, '').toLowerCase()
    if (protocol !== undefined && protocol !== urlProtocol) {
        return false
    }
    const patternHostname = hostname === undefined ? undefined : parseUrl(`http://${hostname}`)?.hostname
    if (patternHostname !== undefined && patternHostname !== url.hostname) {
        return false
    }
    return port === undefined || (port || DEFAULT_PORTS[protocol ?? urlProtocol]) === (url.port || DEFAULT_PORTS[urlProtocol])
}

/**
 * Whether a network intercept of this page may pause a request to `url`. A
 * request without a valid url may match any intercept.
 */
export function mayInterceptRequest (url?: string) {
    const intercepts = window.__wdioNetworkIntercepts__
    if (!intercepts?.size) {
        return false
    }

    const requestUrl = url ? parseUrl(url, location.href) : undefined
    return !requestUrl || [...intercepts.values()].some((urlPatterns) => (
        !urlPatterns?.length || urlPatterns.some((pattern) => mayMatchUrlPattern(pattern, requestUrl))
    ))
}

interface CallSite {
    isNative (): boolean
    getFileName (): string | null | undefined
    getScriptNameOrSourceURL (): string | null | undefined
}
type PrepareStackTrace<Frame extends CallSite> = (error: Error, frames: Frame[]) => unknown

/**
 * source-map-support maps a frame with a synchronous request for its file, the
 * first time it sees that file, and then caches the map. While a network
 * intercept of this page may pause that request, the page, blocked in it, can
 * never release it. Then leave a frame of a file it did not map before as is:
 * it calls `isNative()` and prints a native frame without a lookup. It does
 * not cache an empty map for that file either, so the frame maps again once
 * the intercept is removed.
 */
export function guardSourceMapLookups<Frame extends CallSite> (mapStackTrace: PrepareStackTrace<Frame>): PrepareStackTrace<Frame> {
    const mappedFiles = new Set<string>()
    return (error, frames) => mapStackTrace(error, frames.map((frame) => {
        const file = frame.getFileName() || frame.getScriptNameOrSourceURL()
        if (frame.isNative() || (file && mappedFiles.has(file))) {
            return frame
        }
        if (mayInterceptRequest(file ?? undefined)) {
            return { isNative: () => true, toString: () => String(frame) } as Frame
        }
        if (file) {
            mappedFiles.add(file)
        }
        return frame
    }))
}
