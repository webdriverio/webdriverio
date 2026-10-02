import { setWdioKind } from '@wdio/utils'
import type { local } from 'webdriver'

import type { Response as MockResponse } from './utils/interception/types.js'

const MISSING_INSTANCE = (name: string) => `Multi-remote object has no instance named "${name}"`

type FanOutMethod =
    | 'abort'
    | 'abortOnce'
    | 'clear'
    | 'reset'
    | 'redirect'
    | 'redirectOnce'
    | 'request'
    | 'requestOnce'
    | 'respond'
    | 'respondOnce'
    | 'on'

interface InstanceFailure {
    name: string
    error: unknown
}

/**
 * One network mock per multi-remote instance. Mutating methods run on every
 * instance. Read `calls` from a single mock via `getInstance`.
 */
export class MultiRemoteMock implements WebdriverIO.MultiRemoteMock {
    readonly instances: string[]
    readonly isMultiRemote = true as const
    #mocks = new Map<string, WebdriverIO.Mock>()

    constructor (instanceNames: readonly string[], mocks: readonly WebdriverIO.Mock[]) {
        if (instanceNames.length !== mocks.length) {
            throw new Error(
                `Cannot build a multi-remote mock: instance names (${instanceNames.length}) and mocks (${mocks.length}) differ`
            )
        }

        this.instances = [...instanceNames]
        instanceNames.forEach((name, index) => {
            this.#mocks.set(name, mocks[index])
        })
    }

    /**
     * The mock registered on one instance.
     */
    getInstance (name: string): WebdriverIO.Mock {
        const found = this.#mocks.get(name)
        if (!found) {
            throw new Error(MISSING_INSTANCE(name))
        }
        return found
    }

    abort (...args: Parameters<WebdriverIO.Mock['abort']>) {
        return this.#each('abort', args)
    }

    abortOnce (...args: Parameters<WebdriverIO.Mock['abortOnce']>) {
        return this.#each('abortOnce', args)
    }

    clear (...args: Parameters<WebdriverIO.Mock['clear']>) {
        return this.#each('clear', args)
    }

    reset (...args: Parameters<WebdriverIO.Mock['reset']>) {
        return this.#each('reset', args)
    }

    redirect (...args: Parameters<WebdriverIO.Mock['redirect']>) {
        return this.#each('redirect', args)
    }

    redirectOnce (...args: Parameters<WebdriverIO.Mock['redirectOnce']>) {
        return this.#each('redirectOnce', args)
    }

    request (...args: Parameters<WebdriverIO.Mock['request']>) {
        return this.#each('request', args)
    }

    requestOnce (...args: Parameters<WebdriverIO.Mock['requestOnce']>) {
        return this.#each('requestOnce', args)
    }

    respond (...args: Parameters<WebdriverIO.Mock['respond']>) {
        return this.#each('respond', args)
    }

    respondOnce (...args: Parameters<WebdriverIO.Mock['respondOnce']>) {
        return this.#each('respondOnce', args)
    }

    on(event: 'request', callback: (request: local.NetworkBeforeRequestSentParameters) => void): this
    on(event: 'match', callback: (match: local.NetworkBeforeRequestSentParameters) => void): this
    on(event: 'continue', callback: (requestId: string) => void): this
    on(event: 'fail', callback: (requestId: string) => void): this
    on(event: 'overwrite', callback: (response: MockResponse) => void): this
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: string, callback: (...args: any[]) => void): this {
        return this.#each('on', [event, callback])
    }

    async restore (...args: Parameters<WebdriverIO.Mock['restore']>): Promise<this> {
        const pending = this.instances.map((name) => {
            try {
                return Promise.resolve(this.getInstance(name).restore(...args))
            } catch (error) {
                return Promise.reject(error)
            }
        })
        const settled = await Promise.allSettled(pending)
        this.#throwIfFailed('restore', settled.flatMap((result, index) => (
            result.status === 'rejected'
                ? [{ name: this.instances[index], error: result.reason }]
                : []
        )))
        return this
    }

    waitForResponse (...args: Parameters<WebdriverIO.Mock['waitForResponse']>): Promise<Awaited<ReturnType<WebdriverIO.Mock['waitForResponse']>>[]> {
        return Promise.all(this.instances.map((name) => this.getInstance(name).waitForResponse(...args)))
    }

    /**
     * Run `method` on every instance. A throw from one instance does not skip
     * the rest; the original error is rethrown, or an `AggregateError` when
     * more than one instance failed.
     */
    #each (method: FanOutMethod, args: unknown[]) {
        const failures: InstanceFailure[] = []
        for (const name of this.instances) {
            const mock = this.getInstance(name)
            const fn = mock[method] as (...params: unknown[]) => unknown
            try {
                fn.apply(mock, args)
            } catch (error) {
                failures.push({ name, error })
            }
        }
        this.#throwIfFailed(method, failures)
        return this
    }

    #throwIfFailed (method: string, failures: InstanceFailure[]) {
        if (failures.length === 0) {
            return
        }
        if (failures.length === 1) {
            throw failures[0].error
        }
        const names = failures.map(({ name }) => name).join(', ')
        throw new AggregateError(
            failures.map(({ error }) => error),
            `Multi-remote mock ${method}() failed for ${names}`
        )
    }
}

/**
 * the same kind as a mock of one instance, `isMultiRemote` tells them apart, see `@wdio/utils` `kind.ts`
 */
setWdioKind(MultiRemoteMock.prototype, 'mock')
