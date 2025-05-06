import { isIP } from 'node:net'
import dns from 'node:dns/promises'
import { type LookupAddress } from 'node:dns'

import logger from '@wdio/logger'

import WebSocket, { type ClientOptions } from 'ws'

const log = logger('webdriver')
const CONNECTION_TIMEOUT = 10000

export async function createBidiConnection(webSocketUrl: string, options?: ClientOptions): Promise<WebSocket | undefined> {
    const candidateUrls = await listWebsocketCandidateUrls(webSocketUrl)
    return connectWebsocket(candidateUrls, options)
}

/**
 * Resolve hostnames to IPv4 and IPv6 addresses
 * @returns list of websocket urls to try
 * @see https://github.com/webdriverio/webdriverio/issues/14039
 */
export async function listWebsocketCandidateUrls(webSocketUrl: string): Promise<string[]> {
    const parsedUrl = new URL(webSocketUrl)
    const candidateUrls: string[] = [webSocketUrl]
    if (isIP(parsedUrl.hostname)) {
        return candidateUrls
    }

    try {
        const candidateIps = await dns.lookup(parsedUrl.hostname, { family:0, all:true })
        // If the host resolves to a single IP address
        // then it does not make sense to try additional candidates
        // as the web socket DNS resolver would do extactly the same
        if (candidateIps.length > 1) {
            const hostnameMapper = (result: LookupAddress) => webSocketUrl.replace(parsedUrl.hostname, result.address)
            candidateUrls.push(...candidateIps.map(hostnameMapper))
        }
    } catch (error) {
        log.error(`Could not resolve hostname ${parsedUrl.hostname}: ${error}`)
    }

    return candidateUrls
}

interface ConnectionResult {
    ws: WebSocket
    isConnected: boolean
    errorMessage?: string
    index: number
}

interface ConnectionPromise {
    index: number
    promise: Promise<ConnectionResult>
}

/**
 * Connect to a websocket
 * @param candidateUrls - list of websocket urls to try
 * @returns true if the connection was successful
 */
export async function connectWebsocket(candidateUrls: string[], options?: ClientOptions): Promise<WebSocket | undefined> {
    const websockets: WebSocket[] = candidateUrls.map((candidateUrl) => {
        log.debug(`Attempt to connect to webSocketUrl ${candidateUrl}`)
        try {
            const ws = new WebSocket(candidateUrl, options)
            return ws
        } catch {
            return undefined
        }
    }).filter(Boolean) as WebSocket[]

    const wsConnectPromises: ConnectionPromise[] = websockets.map((ws, index) => {
        const promise = new Promise<ConnectionResult>((resolve) => {
            ws.once('open', () => resolve({ ws, isConnected: true, index }))
            ws.once('error', (err) => {
                log.debug(`Could not connect to Bidi protocol at ${candidateUrls[index]}: ${err.message}`)
                resolve({ ws, isConnected: false, errorMessage: err.message, index })
            })
        })
        return { promise, index }
    })

    let timeoutId

    const connectionTimeoutPromise = new Promise<undefined>((resolve) => {
        timeoutId = setTimeout(() => {
            log.error(`Could not connect to Bidi protocol of any candidate url in time: "${candidateUrls.join('", "')}"`)
            return resolve(undefined)
        }, CONNECTION_TIMEOUT)
    })

    const wsInfo = await Promise.race([
        firstResolved(wsConnectPromises),
        connectionTimeoutPromise,
    ])

    clearTimeout(timeoutId)

    const socketsToCleanup = wsInfo ? websockets.filter((_, index) => wsInfo.index !== index) : websockets
    for (const socket of socketsToCleanup) {
        socket.removeAllListeners()
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CLOSING) {
            socket.terminate()
        } else {
            socket.once('open', () => socket.terminate())
        }
    }

    if (wsInfo?.isConnected) {
        log.info(`Connected to Bidi protocol at ${candidateUrls[wsInfo.index]}`)
        return wsInfo.ws
    }

    return undefined
}

/**
 * Race the promises and return the first resolved promise that shows a successful connection
 * @param promises - list of promises to race
 * @returns the first resolved promise
 */
function firstResolved (promises: ConnectionPromise[], errorMessages: string[] = []): Promise<ConnectionResult | undefined> {
    if (promises.length === 0) {
        const sep = '\n  - '
        const errorMessage = errorMessages.length > 0
            ? sep + errorMessages.join(sep)
            : ''
        log.error('Could not connect to Bidi protocol' + errorMessage)
        return Promise.resolve(undefined)
    }

    // Race the wrapped promises
    return Promise.race(promises.map(({ promise }) => promise)).then((result) => {
        if (result.isConnected) {
            return result
        }

        // If the first result was a rejection, race the remaining promises
        return firstResolved(
            promises.filter(({ index }) => index !== result.index),
            [...errorMessages, result.errorMessage || 'unknown error']
        )
    })
}
