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

/**
 * One network mock per multiremote instance. Mutating methods run on every
 * instance. Read `calls` from a single mock via `getInstance`.
 */
export class MultiRemoteMock implements WebdriverIO.MultiRemoteMock {
    readonly instances: string[]
    readonly isMultiRemote = true as const
    #mocks = new Map<string, WebdriverIO.Mock>()

    constructor (instanceNames: readonly string[], mocks: readonly WebdriverIO.Mock[]) {
        if (instanceNames.length !== mocks.length) {
            throw new Error(
                `Cannot build a multiremote mock: instance names (${instanceNames.length}) and mocks (${mocks.length}) differ`
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

    on (...args: Parameters<WebdriverIO.Mock['on']>) {
        return this.#each('on', args)
    }

    async restore (...args: Parameters<WebdriverIO.Mock['restore']>): Promise<this> {
        await Promise.all(this.instances.map((name) => this.getInstance(name).restore(...args)))
        return this
    }

    waitForResponse (...args: Parameters<WebdriverIO.Mock['waitForResponse']>): Promise<Awaited<ReturnType<WebdriverIO.Mock['waitForResponse']>>[]> {
        return Promise.all(this.instances.map((name) => this.getInstance(name).waitForResponse(...args)))
    }

    getBinaryResponse (...args: Parameters<WebdriverIO.Mock['getBinaryResponse']>) {
        return this.instances.map((name) => this.getInstance(name).getBinaryResponse(...args))
    }

    #each (method: FanOutMethod, args: unknown[]) {
        for (const name of this.instances) {
            const mock = this.getInstance(name)
            const fn = mock[method] as (...params: unknown[]) => unknown
            fn.apply(mock, args)
        }
        return this
    }
}
