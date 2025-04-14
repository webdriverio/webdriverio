import { fetch as undiciFetch, type RequestInit as UndiciRequestInit, ProxyAgent } from 'undici'

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

export function _fetch(input: RequestInfo | URL, init?: RequestInit) {
    const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY
    if (proxyUrl) {
        const noProxy = process.env.NO_PROXY && process.env.NO_PROXY.trim()
            ? process.env.NO_PROXY.trim().split(/[\s,;]+/)
            : []
        const request = new Request(input)
        const url = new URL(request.url)
        if (!noProxy.some((str) => url.hostname.endsWith(str))) {
            return undiciFetch(
                request.url,
                { ...(init as UndiciRequestInit), dispatcher: new ProxyAgent(proxyUrl) },
            ) as unknown as Promise<Response>
        }
    }
    return fetch(input, init)
}
