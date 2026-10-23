/**
 * The test of an `act()` or `extract()` call ended while the call ran, e.g.
 * at the timeout of the test framework, which cannot stop the call itself.
 */
export class TestEndedError extends Error {
    constructor (title: string) {
        super(`the test "${title}" ended before the call finished`)
        this.name = 'TestEndedError'
    }
}

/**
 * Stops a call between its steps, never in the middle of one: an action
 * that already runs finishes, so it can't change the page or the agent
 * session after the call returned.
 */
export class StepGate {
    readonly signal?: AbortSignal
    #running = 0
    #stop = new AbortController()
    #closed = false
    #idle: (() => void)[] = []

    constructor (signal?: AbortSignal) {
        this.signal = signal
        signal?.addEventListener('abort', () => this.#stopWhenIdle(), { once: true })
        this.#stopWhenIdle()
    }

    /**
     * aborts the model loop once the test ended and no step runs
     */
    get loopSignal () {
        return this.signal && this.#stop.signal
    }

    async step<T> (run: () => Promise<T>): Promise<T> {
        this.check()
        this.#running++
        try {
            return await run()
        } finally {
            this.#running--
            this.#stopWhenIdle()
            if (!this.#running) {
                this.#idle.splice(0).forEach((resolve) => resolve())
            }
        }
    }

    /**
     * Throws once the test ended or the call ended. A step calls it again
     * right before its action: what it waited for or read before can
     * already be on the page of the next test.
     */
    check () {
        this.signal?.throwIfAborted()
        if (this.#closed) {
            throw new Error('the call already ended')
        }
    }

    /**
     * The call ends: no step starts anymore, and the call returns once the
     * running steps ended. Its timeout aborts the model loop at once, also
     * while a step still uses the browser.
     */
    close () {
        this.#closed = true
        return this.#running ? new Promise<void>((resolve) => this.#idle.push(resolve)) : Promise.resolve()
    }

    #stopWhenIdle () {
        if (this.signal?.aborted && !this.#running) {
            this.#stop.abort(this.signal.reason)
        }
    }
}
