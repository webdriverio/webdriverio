import { expect, type MatcherContext, type ExpectationResult, type SyncExpectationResult } from 'expect'
import { $ } from '@wdio/globals'
import type { ChainablePromiseElement } from 'webdriverio'
import type { AnyWSMessage, WSMessageValue } from '@wdio/types'
import { WS_MESSAGE_TYPES } from '@wdio/types'

import { getCID } from './utils.js'
import { WDIO_EVENT_NAME } from '../constants.js'

import { isWSMessage } from '@wdio/utils'

declare type RawMatcherFn<Context extends MatcherContext = MatcherContext> = {
    (this: Context, actual: unknown, ...expected: Array<unknown>): ExpectationResult;
}

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
 * Matcher factory enables to run all matchers within the browser by sending all necessary information
 * to the worker process and execute the actual assertion in the Node.js environment.
 * @param matcherName name of the matcher
 * @returns a matcher result computed in the Node.js environment
 */
function createMatcher (matcherName: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async function (this: MatcherContext, context: WebdriverIO.Browser | WebdriverIO.Element | ChainablePromiseElement | ChainablePromiseArray, ...args: any[]) {
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

        const expectRequest: WSMessageValue[WS_MESSAGE_TYPES.expectRequestMessage] = {
            id: matcherRequestCount++,
            cid,
            scope: this,
            matcherName,
            args: args
        }

        const isContextObject = typeof context === 'object'

        /**
         * Check if context is an WebdriverIO.Element
         */
        if (isContextObject && 'selector' in context && 'selector' in context) {
            expectRequest.element = context
        }

        /**
         * Check if context is ChainablePromiseElement
         */
        if (isContextObject && 'then' in context && typeof (context as { selector: string }).selector === 'object') {
            expectRequest.element = await context
        }

        /**
         * Check if context is a `Element` and transform it into a WebdriverIO.Element
         */
        if (context instanceof Element) {
            expectRequest.element = await $(context as unknown as HTMLElement)
        } else if (isContextObject && !('sessionId' in context)) {
            /**
             * check if context is an object or promise and resolve it
             * but not pass through the browser object
             */
            expectRequest.context = context
            if ('then' in context) {
                expectRequest.context = await context
            }
        } else if (!isContextObject) {
            /**
             * if context is not an object or promise, pass it through
             */
            expectRequest.context = context
        }
        /**
         * Avoid serialization issues when sending an element.
         * If the element was created from an existing HTMLElement,
         * it may have a non-serializable selector (e.g. Promise).
         * Strip it to ensure safe message transfer.
         */
        interface SerializableElement {
            selector?: unknown
        }
        if (expectRequest.element && 'selector' in expectRequest.element) {
            delete (expectRequest.element as SerializableElement).selector
        }

        /**
         * pass along the stack trace from the browser to the testrunner so that
         * the snapshot tool can determine the correct location to update the
         * snapshot call.
         */
        if (matcherName === 'toMatchInlineSnapshot') {
            ;(expectRequest.scope as { errorStack?: string }).errorStack = (
                new Error('inline snapshot error')
            ).stack?.split('\n')
                .find(line => line.includes(window.__wdioSpec__))
                ?.replace(/http:\/\/localhost:\d+/g, '')
                .replace('/@fs/', '/')
        }

        import.meta.hot.send(WDIO_EVENT_NAME, { type: WS_MESSAGE_TYPES.expectRequestMessage, value: expectRequest })
        const contextString = isContextObject
            ? 'elementId' in context
                ? 'WebdriverIO.Element'
                : 'WebdriverIO.Browser'
            : context

        return new Promise<SyncExpectationResult>((resolve, reject) => {
            const commandTimeout = setTimeout(
                () => reject(new Error(`Assertion expect(${contextString}).${matcherName}(...) timed out`)),
                COMMAND_TIMEOUT
            )

            matcherRequests.set(expectRequest.id, { resolve, commandTimeout })
        })
    }
}

/**
 * request all available matchers from the testrunner
 */
import.meta.hot?.send(WDIO_EVENT_NAME, { type: WS_MESSAGE_TYPES.expectMatchersRequest })

/**
 * listen on assertion results from testrunner
 */
import.meta.hot?.on(WDIO_EVENT_NAME, (message: AnyWSMessage) => {
    if (isWSMessage(message, WS_MESSAGE_TYPES.expectMatchersResponse)) {
        const { matchers } = message.value
        const matcherFns = matchers.reduce((acc, matcherName) => {
            acc[matcherName] = createMatcher(matcherName)
            return acc
        }, {} as Record<string, RawMatcherFn<MatcherContext>>)
        expect.extend(matcherFns)
    }

    if (!isWSMessage(message, WS_MESSAGE_TYPES.expectResponseMessage)) {
        return
    }

    const { id, pass, message: msg } = message.value
    const payload = matcherRequests.get(id)
    if (!payload) {
        return console.warn(`Couldn't find payload for assertion result with id ${id}`)
    }

    clearTimeout(payload.commandTimeout)
    matcherRequests.delete(id)
    payload.resolve({
        pass,
        message: () => msg
    })
})

export { expect }
