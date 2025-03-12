import { isIP } from 'node:net'
import dns from 'node:dns/promises'

import logger from '@wdio/logger'

import WebSocket from 'ws'

const log = logger('webdriver')

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

/**
 * Connect to a websocket
 * @param candidateUrls - list of websocket urls to try
 * @returns true if the connection was successful
 */
export async function connectWebsocket(candidateUrls: string[], _?: unknown): Promise<WebSocket | undefined> {
    const wsConnectPromises: Promise<WebSocket | undefined>[] = []
    const errorMessages: string[] = []
    let onFirstWebsocketConnected = (_ws: WebSocket) => {}
    const firstWebsocketConnectedPromise = new Promise<WebSocket>((resolve) => {
        onFirstWebsocketConnected = resolve
    })
    const candidateWebsockets: WebSocket[] = []
    for (const candidateUrl of candidateUrls) {
        const ws = new WebSocket(candidateUrl) as unknown as WebSocket
        candidateWebsockets.push(ws)
        const connectPromise = new Promise<WebSocket | undefined>((resolve) => {
            ws.once('open', () => {
                log.info(`Connected session to Bidi protocol at ${candidateUrl}`)
                onFirstWebsocketConnected(ws)
                resolve(ws)
            })
            ws.once('error', (err) => {
                errorMessages.push(`Couldn't connect to Bidi protocol at ${candidateUrl}: ${err.message}`)
                resolve(undefined)
            })
        })
        wsConnectPromises.push(connectPromise)
    }
    // We either wait until any web socket is successfully connected
    // or all of them fail
    await Promise.race([
        firstWebsocketConnectedPromise,
        Promise.all(wsConnectPromises)
    ])

    const ws = await firstWebsocketConnectedPromise

    if (ws) {
        // Cleanup extra opened sockets
        candidateWebsockets
            .filter((candidate) => ws !== candidate)
            .forEach((ws) => ws.close())
    } else {
        for (const errorMessage of errorMessages) {
            log.warn(errorMessage)
        }
    }
    return ws
}