import { expect, type MatcherContext, type ExpectationResult, type SyncExpectationResult } from 'expect'
import { MESSAGE_TYPES, type Workers } from '@wdio/types'
import { $ } from '@wdio/globals'
import type { ChainablePromiseElement, ChainablePromiseArray } from 'webdriverio'

import { getCID } from './utils.js'
import { WDIO_EVENT_NAME } from '../constants.js'

// Define AsymmetricMatcher class matching Jest/Expect internals
class AsymmetricMatcher {
    $$typeof = asymmetricMatcher
    constructor(public sample: unknown, public matcherName?: string) {}
    toString() {
        return this.matcherName
    }
}

type Expect = typeof expect & {
    // Modifiers fake as an asymmetric matcher for now, but we can implement a proper modifier later
    some(elements: WebdriverIO.Element[] | WebdriverIO.ElementArray | ChainablePromiseArray): AsymmetricMatcher
    oneOf(...sample: string[]): AsymmetricMatcher
}
const expectWithHelpers = expect as Expect

/**
 * Attach serializable asymmetric matchers helpers to the browser expect object
 *
 * For real asymmetric matchers, name must match the name of the matcher in SUPPORTED_ASYMMETRIC_MATCHER
 * @see packages/wdio-runner/src/utils.ts#SUPPORTED_ASYMMETRIC_MATCHER
 *
 * For modifiers `some`, it is custom handled.
 */
expectWithHelpers.oneOf = (...sample: string[]) => new AsymmetricMatcher(sample, 'OneOf')
expectWithHelpers.some = (sample: WebdriverIO.Element[] | WebdriverIO.ElementArray | ChainablePromiseArray) => new AsymmetricMatcher(sample, 'Some')

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
    return async function (this: MatcherContext, context: WebdriverIO.Browser | WebdriverIO.Element | ChainablePromiseElement | ChainablePromiseArray | WebdriverIO.Element[] | WebdriverIO.ElementArray, ...args: any[]) {
        const cid = getCID()
        if (!import.meta.hot || !cid) {
            return {
                pass: false,
                message: () => 'Could not connect to testrunner'
            }
        }

        const serializedArgs = args.map(serializeAsymmetricMatchers)

        const expectRequest: Workers.ExpectRequestEvent = {
            id: matcherRequestCount++,
            cid,
            scope: this,
            matcherName,
            args: serializedArgs
        }

        if (context instanceof AsymmetricMatcher && context.matcherName === 'Some') {
            expectRequest.scope.isSome = true
            context = context.sample as WebdriverIO.Element[] | WebdriverIO.ElementArray | ChainablePromiseArray
        }

        const isContextObject = typeof context === 'object'

        if (context && isContextObject) {
            /**
             * Check if context is a Chainable (ChainablePromiseElement or ChainablePromiseArray)
             */
            if ('then' in context && typeof (context as { selector?: string }).selector === 'object') {
                expectRequest.element = await context
            } else if ('selector' in context) {
                /**
                 * Check if context is an WebdriverIO.Element or WebdriverIO.ElementArray
                 */
                expectRequest.element = context
            } if (Array.isArray(context) && context.every((el) => 'selector' in el)) {
                /**
                 * Check if context is an array of elements (WebdriverIO.Element[]) aka filtered ElementArray
                 */
                expectRequest.element = context
            }
        }

        /**
         * Check if context is a `Element` and transform it into a WebdriverIO.Element
         */
        if (context instanceof Element) {
            expectRequest.element = await $(context as unknown as HTMLElement)
        } else if (context && isContextObject && !('sessionId' in context)) {
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
         * Avoid serialization issues when sending over the element. If we create
         * an element from an existing HTMLElement, it might have custom properties
         * attached to it that can't be serialized.
         */
        if (expectRequest.element && typeof (expectRequest.element as { selector: unknown }).selector !== 'string') {
            (expectRequest.element as { selector: unknown }).selector = undefined
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
import.meta.hot?.send(WDIO_EVENT_NAME, { type: MESSAGE_TYPES.expectMatchersRequest })

/**
 * listen on assertion results from testrunner
 */
import.meta.hot?.on(WDIO_EVENT_NAME, (message: Workers.SocketMessage) => {
    /**
     * Set up `expect-webdriverio` matchers for the browser environment.
     * Every assertion is send to the testrunner via a websocket connection
     * and is executed in the Node.js environment. This allows us to enable
     * matchers that require Node.js specific modules like `fs` or `child_process`,
     * for visual regression or snapshot testing for example.
     *
     * The testrunner will send a list of available matchers to the browser
     * since there might services or other hooks that add custom matchers.
     */
    if (message.type === MESSAGE_TYPES.expectMatchersResponse) {
        const matchers = message.value.matchers.reduce((acc, matcherName) => {
            acc[matcherName] = createMatcher(matcherName)
            return acc
        }, {} as Record<string, RawMatcherFn<MatcherContext>>)
        expect.extend(matchers)
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

function serializeAsymmetricMatchers(arg: unknown): unknown {
    if (!arg || typeof arg !== 'object') {
        return arg
    }

    const asymmetricArg = arg as { $$typeof?: symbol, sample?: unknown, inverse?: boolean, matcherName?: string, asymmetricMatch?: (other: unknown) => boolean }
    // Handle asymmetric matchers (like expect.oneOf, expect.stringContaining)
    if ('$$typeof' in asymmetricArg && asymmetricArg.$$typeof === asymmetricMatcher) {
        return {
            $$typeof: asymmetricArg.toString(),
            matcherName: asymmetricArg.matcherName,
            sample: serializeAsymmetricMatchers(asymmetricArg.sample)
        }
    }

    if (Array.isArray(arg)) {
        return arg.map(serializeAsymmetricMatchers)
    }

    return arg
}

export { expectWithHelpers as expect }
