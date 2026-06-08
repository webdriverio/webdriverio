import { fetch as undiciFetch, type RequestInit as UndiciRequestInit, ProxyAgent, Agent, type Dispatcher } from 'undici'

import { getMergedCa } from './caCert.js'

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
// cache one per (proxy, connectTimeout, hasCa) combination instead of creating a new
// one on every request. undici agents are long-lived by design (SDK-5953); caching
// also avoids re-parsing the merged CA (~148 certs) into a fresh TLS SecureContext on
// every proxied request. The merged CA is process-stable, so `hasCa` is a sufficient
// discriminator alongside the proxy URL and connect timeout.
const dispatcherCache = new Map<string, Dispatcher>()

function getDispatcher(proxyUrl: string | undefined, connectTimeoutMs: number | undefined, ca: string[] | undefined): Dispatcher {
    const key = `${proxyUrl ?? 'direct'}:${connectTimeoutMs ?? 'default'}:${ca ? '1' : '0'}`
    let dispatcher = dispatcherCache.get(key)
    if (!dispatcher) {
        const connect = connectTimeoutMs !== undefined ? { timeout: connectTimeoutMs } : undefined
        if (proxyUrl) {
            // SDK-5953: when a customer CA is configured, trust it on the proxy tunnel's
            // upstream TLS too (the global dispatcher is bypassed when a dispatcher is set).
            // SDK-6152: carry the larger connect timeout on the same agent.
            dispatcher = new ProxyAgent({
                uri: proxyUrl,
                ...(connect ? { connect } : {}),
                ...(ca ? { requestTls: { ca } } : {}),
            })
        } else {
            dispatcher = new Agent(connect ? { connect } : {})
        }
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
            // SDK-5953: trust a customer CA on the tunnel's upstream TLS; SDK-6152: allow a
            // connect timeout larger than global fetch's fixed 10s. Both are carried by a
            // single cached ProxyAgent dispatcher.
            const dispatcher = getDispatcher(proxyUrl, connectTimeoutMs, getMergedCa())
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
            { ...(init as UndiciRequestInit), dispatcher: getDispatcher(undefined, connectTimeoutMs, undefined) },
        ) as unknown as Promise<Response>
    }
    return fetch(input, init)
}
