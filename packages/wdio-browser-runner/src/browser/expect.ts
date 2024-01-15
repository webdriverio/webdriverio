import { expect, type MatcherContext, type ExpectationResult, type SyncExpectationResult } from 'expect'
import { matchers } from 'virtual:wdio'

import { getCID } from './utils.js'
import { MESSAGE_TYPES } from '../constants.js'
import type { ExpectRequestEvent, SocketMessagePayload } from '../vite/types.js'

declare type RawMatcherFn<Context extends MatcherContext = MatcherContext> = {
    (this: Context, actual: any, ...expected: Array<any>): ExpectationResult;
};

interface MatcherPayload {
    resolve: (result: SyncExpectationResult) => void
    commandTimeout: NodeJS.Timeout
}

const asymmetricMatcher =
    typeof Symbol === 'function' && Symbol.for
        ? Symbol.for('jest.asymmetricMatcher')
        : 0x13_57_a5

let hasSetupListener = false
let matcherRequestCount = 0
const matcherRequests = new Map<string, MatcherPayload>()
const COMMAND_TIMEOUT = 30 * 1000 // 30s

/**
 * Set up expect-webdriverio matchers for the browser environment.
 * Every assertion is send to the testrunner via a websocket connection
 * and is executed in the Node.js environment. This allows us to enable
 * matchers that require Node.js specific modules like `fs` or `child_process`,
 * for visual regression or snapshot testing for example.
 */
expect.extend(matchers.reduce((acc, matcherName) => {
    acc[matcherName] = function (context: WebdriverIO.Browser | WebdriverIO.Element, ...args: any[]) {
        const socket = window.__wdioSocket__
        const cid = getCID()
        if (!socket || !cid) {
            return {
                pass: false,
                message: () => 'Could not connect to testrunner'
            }
        }

        if (!hasSetupListener) {
            hasSetupListener = setupListener(socket)
        }

        if (typeof args[0] === 'object' && '$$typeof' in args[0] && args[0].$$typeof === asymmetricMatcher && args[0].asymmetricMatch) {
            args[0] = {
                $$typeof: args[0].toString(),
                sample: args[0].sample,
                inverse: args[0].inverse
            }
        }

        const expectRequest: ExpectRequestEvent = {
            id: String(matcherRequestCount++),
            cid,
            scope: this,
            matcherName,
            args: args
        }

        socket.send(JSON.stringify({ type: MESSAGE_TYPES.expectRequestMessage, value: expectRequest }))
        const contextString = 'elementId' in context ? 'WebdriverIO.Element' : 'WebdriverIO.Browser'

        return new Promise<SyncExpectationResult>((resolve, reject) => {
            const commandTimeout = setTimeout(
                () => reject(new Error(`Assertion expect(${contextString}).${matcherName}(...) timed out`)),
                COMMAND_TIMEOUT
            )

            matcherRequests.set(expectRequest.id, { resolve, commandTimeout })
        })
    }
    return acc
}, {} as Record<string, RawMatcherFn<MatcherContext>>))

function setupListener (socket: WebSocket) {
    socket.addEventListener('message', (event) => {
        let message: SocketMessagePayload<MESSAGE_TYPES.expectResponseMessage>
        try {
            message = JSON.parse(event.data) as SocketMessagePayload<MESSAGE_TYPES.expectResponseMessage>
        } catch (err) {
            return console.error('Couldn\'t parse message from testrunner:', event.data)
        }

        if (message.type !== MESSAGE_TYPES.expectResponseMessage) {
            return
        }
        const payload = matcherRequests.get(message.value.id)
        if (!payload) {
            return console.warn(`Couldn't find payload for assertion result with id ${message.value.id}`)
        }

        clearTimeout(payload.commandTimeout)
        matcherRequests.delete(message.value.id)
        payload.resolve({
            pass: message.value.pass,
            message: () => message.value.message
        })
    })

    return true
}

export { expect }
