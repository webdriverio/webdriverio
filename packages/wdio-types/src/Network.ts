export interface Request {
    id?: string
    url: string
    timestamp: number
    navigation?: string
    redirectChain?: string[],
    headers: Record<string, string>
    cookies?: NetworkCookie[]
    /**
     * Error message if request failed
     */
    error?: string
    response?: {
        fromCache: boolean
        headers: Record<string, string>
        mimeType: string
        status: number
    },
    /**
     * List of all requests that were made due to the main request.
     * Note: the list may be incomplete and does not contain request that were
     * made after the command has finished.
     *
     * The property will be undefined if the request is not a document request
     * that was initiated by the browser.
     */
    children?: Request[]
}

export type NetworkSameSite = 'strict' | 'lax' | 'none'
export type Extensible = Record<string, unknown>
export interface NetworkCookie extends Extensible {
    name: string
    value: string
    domain: string
    path: string
    size: number
    httpOnly: boolean
    secure: boolean
    sameSite: NetworkSameSite
    expiry?: number
}
