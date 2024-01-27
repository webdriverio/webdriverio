import { expect, type MatcherContext, type ExpectationResult, type SyncExpectationResult } from 'expect'
import { MESSAGE_TYPES, type Workers } from '@wdio/types'
import { matchers } from 'virtual:wdio'
import { $ } from '@wdio/globals'
import type { ChainablePromiseElement } from 'webdriverio'

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
expect.extend(matchers.reduce((acc, matcherName) => {
    acc[matcherName] = async function (context: WebdriverIO.Browser | WebdriverIO.Element | ChainablePromiseElement<WebdriverIO.Element> | ChainablePromiseArray, ...args: any[]) {
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

        /**
         * Check if context is an WebdriverIO.Element
         */
        if ('elementId' in context && typeof context.elementId === 'string') {
            expectRequest.element = context
        }

        /**
         * Check if context is ChainablePromiseElement
         */
        if ('then' in context && typeof (context as any).selector === 'object') {
            expectRequest.element = await context
        }

        /**
         * Check if context is a `Element` and transtform it into a WebdriverIO.Element
         */
        if (context instanceof Element) {
            expectRequest.element = await $(context as any as HTMLElement)
        } else if (typeof context === 'object' && !('sessionId' in context)) {
            /**
             * check if context is an object or promise and resolve it
             * but not pass through the browser object
             */
            expectRequest.context = context
            if ('then' in context) {
                expectRequest.context = await context
            }
        }

        /**
         * Avoid serialization issues when sending over the element. If we create
         * an element from an existing HTMLElement, it might have custom properties
         * attached to it that can't be serialized.
         */
        if (expectRequest.element && typeof expectRequest.element.selector !== 'string') {
            expectRequest.element.selector = undefined
        }

        /**
         * pass along the stack trace from the browser to the testrunner so that
         * the snapshot tool can determine the correct location to update the
         * snapshot call.
         */
        if (matcherName === 'toMatchInlineSnapshot') {
            expectRequest.scope.errorStack = (new Error('inline snapshot error'))
                .stack
                ?.split('\n')
                .find((line) => line.includes(window.__wdioSpec__))
                /**
                 * stack traces within the browser have an url path, e.g.
                 * `http://localhost:8080/@fs/path/to/__tests__/unit/snapshot.test.js:123:45`
                 * that we want to remove so that the stack trace is properly
                 * parsed by Vitest, e.g. make it to:
                 * `/__tests__/unit/snapshot.test.js:123:45`
                 */
                ?.replace(/http:\/\/localhost:\d+/g, '')
                .replace('/@fs/', '/')
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
