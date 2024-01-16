import { expect, type MatcherContext, type ExpectationResult, type SyncExpectationResult } from 'expect'
import { MESSAGE_TYPES, type Workers } from '@wdio/types'
import { matchers } from 'virtual:wdio'

import { getCID } from './utils.js'
import { WDIO_EVENT_NAME } from '../constants.js'

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

let matcherRequestCount = 0
const matcherRequests = new Map<number, MatcherPayload>()
const COMMAND_TIMEOUT = 30 * 1000 // 30s

/**
 * Set up expect-webdriverio matchers for the browser environment.
 * Every assertion is send to the testrunner via a websocket connection
 * and is executed in the Node.js environment. This allows us to enable
 * matchers that require Node.js specific modules like `fs` or `child_process`,
 * for visual regression or snapshot testing for example.
 */
expect.extend([...matchers, 'toMatchElementSnapshot'].reduce((acc, matcherName) => {
    acc[matcherName] = function (context: WebdriverIO.Browser | WebdriverIO.Element, ...args: any[]) {
        const cid = getCID()
        if (!import.meta.hot || !cid) {
            return {
                pass: false,
                message: () => 'Could not connect to testrunner'
            }
        }

        if (typeof args[0] === 'object' && '$$typeof' in args[0] && args[0].$$typeof === asymmetricMatcher && args[0].asymmetricMatch) {
            args[0] = {
                $$typeof: args[0].toString(),
                sample: args[0].sample,
                inverse: args[0].inverse
            }
        }

        const expectRequest: Workers.ExpectRequestEvent = {
            id: matcherRequestCount++,
            cid,
            scope: this,
            matcherName,
            args: args
        }

        if ('elementId' in context) {
            expectRequest.elementId = context.elementId
        }

        import.meta.hot.send(WDIO_EVENT_NAME, { type: MESSAGE_TYPES.expectRequestMessage, value: expectRequest })
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

/**
 * listen on assertion results from testrunner
 */
import.meta.hot?.on(WDIO_EVENT_NAME, (message: Workers.SocketMessage) => {
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

export { expect }
