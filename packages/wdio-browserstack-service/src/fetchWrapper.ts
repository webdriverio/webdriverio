import { fetch as undiciFetch, type RequestInit as UndiciRequestInit, ProxyAgent } from 'undici'

import { getMergedCa } from './caCert.js'

export class ResponseError extends Error {
    public response: Response
    constructor(message: string, res: Response) {
        super(message)
        this.response = res
    }
}

export default async function fetchWrap(input: RequestInfo | URL, init?: RequestInit) {
    const res = await _fetch(input, init)
    if (!res.ok) {
        throw new ResponseError(`Error response from server ${res.status}:  ${await res.text()}`, res)
    }
    return res
}

// SDK-5953: cache the ProxyAgent per (proxyUrl, hasCa). undici agents are long-lived by design,
// so this avoids rebuilding the agent — and re-parsing the merged CA (~148 certs) into a fresh
// TLS SecureContext — on every proxied request (it also lets the tunnel connection pool be reused).
// The merged CA is process-stable, so `hasCa` is a sufficient discriminator alongside the proxy URL.
const proxyAgentCache = new Map<string, ProxyAgent>()
function getProxyAgent(proxyUrl: string, ca: string[] | undefined): ProxyAgent {
    const key = `${proxyUrl}::${ca ? '1' : '0'}`
    let agent = proxyAgentCache.get(key)
    if (!agent) {
        agent = ca
            ? new ProxyAgent({ uri: proxyUrl, requestTls: { ca } })
            : new ProxyAgent(proxyUrl)
        proxyAgentCache.set(key, agent)
    }
    return agent
}

export function _fetch(input: RequestInfo | URL, init?: RequestInit) {
    const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY
    if (proxyUrl) {
        const noProxy = process.env.NO_PROXY && process.env.NO_PROXY.trim()
            ? process.env.NO_PROXY.trim().split(/[\s,;]+/)
            : []
        const request = new Request(input)
        const url = new URL(request.url)
        if (!noProxy.some((str) => url.hostname.endsWith(str))) {
            // SDK-5953: when a customer CA is configured, trust it on the proxy tunnel's
            // upstream TLS too (the global dispatcher is bypassed when a dispatcher is set).
            // Agent is cached per (proxyUrl, hasCa) so the merged CA isn't re-parsed per request.
            const proxyAgent = getProxyAgent(proxyUrl, getMergedCa())
            return undiciFetch(
                request.url,
                { ...(init as UndiciRequestInit), dispatcher: proxyAgent },
            ) as unknown as Promise<Response>
        }
    }
    return fetch(input, init)
}
