import { isIP } from 'node:net'
import dns from 'node:dns/promises'

import logger from '@wdio/logger'

import WebSocket from 'ws'

const log = logger('webdriver')
const CONNECTION_TIMEOUT = 10000

export async function createBidiConnection(webSocketUrl: string, options?: unknown): Promise<WebSocket | undefined> {
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
    if (!isIP(parsedUrl.hostname)) {
        const candidateIps = (await Promise.all([
            dns.resolve4(parsedUrl.hostname),
            dns.resolve6(parsedUrl.hostname),
        ])).flat()
        // If the host resolves to a single IP address
        // then it does not make sense to try additional candidates
        // as the web socket DNS resolver would do extactly the same
        if (candidateIps.length > 1) {
            const hostnameMapper = (ip: string) => webSocketUrl.replace(parsedUrl.hostname, ip)
            candidateUrls.push(...candidateIps.map(hostnameMapper))
        }
    }
    return candidateUrls
}

interface ConnectionResult {
    index: number
    ws: WebSocket
    isConnected: boolean
    errorMessage?: string
}

/**
 * Connect to a websocket
 * @param candidateUrls - list of websocket urls to try
 * @returns true if the connection was successful
 */
export async function connectWebsocket(candidateUrls: string[], _?: unknown): Promise<WebSocket | undefined> {
    const websockets: WebSocket[] = candidateUrls.map((candidateUrl) => {
        log.debug(`Attempt to connect to webSocketUrl ${candidateUrl}`)
        return new WebSocket(candidateUrl)
    })

    const wsConnectPromises: Promise<ConnectionResult>[] = websockets.map((ws, index) => {
        return new Promise<ConnectionResult>((resolve) => {
            ws.once('open', () => resolve({ ws, isConnected: true, index }))
            ws.once('error', (err) => {
                log.debug(`Could not connect to Bidi protocol at ${candidateUrls[index]}: ${err.message}`)
                resolve({ ws, isConnected: false, errorMessage: err.message, index })
            })
        })
    })

    const connectionTimeoutPromise = new Promise<undefined>((resolve) => {
        setTimeout(() => {
            log.error(`Could not connect to Bidi protocol of any candidate url: "${candidateUrls.join('", "')}"`)
            return resolve(undefined)
        }, CONNECTION_TIMEOUT)
    })

    const ws = await Promise.race([
        firstResolved(wsConnectPromises),
        connectionTimeoutPromise,
    ])

    const socketsToCleanup = ws ? websockets.filter((_, index) => ws.index !== index) : websockets
    for (const socket of socketsToCleanup) {
        socket.removeAllListeners()
        socket.terminate()
    }

    if (ws?.isConnected) {
        log.info(`Connected to Bidi protocol at ${candidateUrls[ws.index]}`)
        return ws.ws
    }

    return undefined
}

/**
 * Race the promises and return the first resolved promise that shows a successful connection
 * @param promises - list of promises to race
 * @returns the first resolved promise
 */
function firstResolved (promises: Promise<ConnectionResult>[]): Promise<ConnectionResult> {
    // Race the wrapped promises
    return Promise.race(promises).then(result => {
        if (result.isConnected) {
            return result
        }

        // If the first result was a rejection, race the remaining promises
        return firstResolved(promises.filter((_, index) => index !== result.index))
    })
}