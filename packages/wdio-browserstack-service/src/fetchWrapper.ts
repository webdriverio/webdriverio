import { fetch as undiciFetch, type RequestInit as UndiciRequestInit, ProxyAgent, Agent, type Dispatcher } from 'undici'

export class ResponseError extends Error {
    public response: Response
    constructor(message: string, res: Response) {
        super(message)
        this.response = res
    }
}

/**
 * Extra options for {@link _fetch} that cannot be expressed through the standard
 * `RequestInit`.
 *
 * `connectTimeoutMs` overrides undici's connection-establishment timeout. Node's
 * global `fetch` hard-codes this to 10s and it is NOT overridable via
 * `AbortSignal` (the signal only bounds the overall request, not the socket
 * connect). In constrained/containerised CI networks (e.g. Kubernetes pods) a
 * TLS/TCP handshake can legitimately take longer than 10s, so global fetch aborts
 * with `UND_ERR_CONNECT_TIMEOUT` even though the endpoint is healthy. Supplying
 * this option routes the request through a custom undici dispatcher with a larger
 * connect timeout.
 */
export interface FetchOptions {
    connectTimeoutMs?: number
}

// Dispatchers are relatively expensive to build and hold a connection pool, so we
// cache one per (proxy, connectTimeout) combination instead of creating a new one
// on every request.
const dispatcherCache = new Map<string, Dispatcher>()

function getDispatcher(proxyUrl: string | undefined, connectTimeoutMs: number): Dispatcher {
    const key = `${proxyUrl ?? 'direct'}:${connectTimeoutMs}`
    let dispatcher = dispatcherCache.get(key)
    if (!dispatcher) {
        dispatcher = proxyUrl
            ? new ProxyAgent({ uri: proxyUrl, connect: { timeout: connectTimeoutMs } })
            : new Agent({ connect: { timeout: connectTimeoutMs } })
        dispatcherCache.set(key, dispatcher)
    }
    return dispatcher
}

export default async function fetchWrap(input: RequestInfo | URL, init?: RequestInit, options?: FetchOptions) {
    const res = await _fetch(input, init, options)
    if (!res.ok) {
        throw new ResponseError(`Error response from server ${res.status}:  ${await res.text()}`, res)
    }
    return res
}

export function _fetch(input: RequestInfo | URL, init?: RequestInit, options?: FetchOptions) {
    const connectTimeoutMs = options?.connectTimeoutMs
    const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY
    if (proxyUrl) {
        const noProxy = process.env.NO_PROXY && process.env.NO_PROXY.trim()
            ? process.env.NO_PROXY.trim().split(/[\s,;]+/)
            : []
        const request = new Request(input)
        const url = new URL(request.url)
        if (!noProxy.some((str) => url.hostname.endsWith(str))) {
            const dispatcher = connectTimeoutMs
                ? getDispatcher(proxyUrl, connectTimeoutMs)
                : new ProxyAgent(proxyUrl)
            return undiciFetch(
                request.url,
                { ...(init as UndiciRequestInit), dispatcher },
            ) as unknown as Promise<Response>
        }
    }
    // Without a proxy, global fetch's connect timeout is fixed at 10s and cannot be
    // overridden, so when a caller needs a larger one we go through undici directly
    // with a custom Agent. The default path is left untouched.
    if (connectTimeoutMs) {
        return undiciFetch(
            new Request(input).url,
            { ...(init as UndiciRequestInit), dispatcher: getDispatcher(undefined, connectTimeoutMs) },
        ) as unknown as Promise<Response>
    }
    return fetch(input, init)
}
