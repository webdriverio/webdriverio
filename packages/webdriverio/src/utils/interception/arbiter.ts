import logger from '@wdio/logger'
import type { local } from 'webdriver'

import { logBackgroundError } from '../sessionEnded.js'

const log = logger('WebDriverInterception')

// A request can end with no later event (closed tab), so the early-answer records are capped.
const MAX_ANSWERED_HOPS = 1000

export type Phase = 'beforeRequestSent' | 'responseStarted'
export type NetworkEvent = local.NetworkBeforeRequestSentParameters | local.NetworkResponseStartedParameters

/**
 * What one mock wants to do with a blocked request in one phase.
 */
export interface Decision {
    /**
     * `defer` lets the request through now and answers the response later
     */
    kind: 'answer' | 'defer' | 'pass'
    /**
     * a tab or parallel-test mock
     */
    scoped: boolean
    /**
     * registration order, older = smaller
     */
    age: number
    /**
     * the BiDi call of this mock, which takes its once entry and calls `answeredEarly` before an early answer
     */
    run (answeredEarly: () => void): Promise<unknown>
    /**
     * emits `continue`, or keeps an abort for the response, and can log the Firefox warning; sends no BiDi call
     */
    lose (winner: Decision): void
}

export interface Candidate {
    readonly age: number
    readonly interceptId: string
    observe (phase: Phase, event: NetworkEvent): void
    decide (phase: Phase, event: NetworkEvent): Decision | undefined | Promise<Decision | undefined>
}

type Entry = [Candidate, Decision | undefined]

// `< 0` when `a` wins: acting beats letting through, then scoped beats session-wide, then older wins.
export function rank (a: Decision, b: Decision): number {
    const tier = (decision: Decision) => decision.kind === 'pass' ? 1 : 0
    return (tier(a) - tier(b)) || (Number(b.scoped) - Number(a.scoped)) || (a.age - b.age)
}

function isPromise<T> (value: T | Promise<T>): value is Promise<T> {
    return typeof (value as Promise<T> | undefined)?.then === 'function'
}

function messageOf (err: unknown) {
    return err instanceof Error ? err.message : String(err)
}

function isNoSuchRequest (err: unknown) {
    return err instanceof Error && err.message.endsWith('no such request')
}

const arbiters = new WeakMap<WebdriverIO.Browser, RequestArbiter>()

// One per browser object: each multi-remote instance and each `attach()` client has its own.
export function arbiterOf (browser: WebdriverIO.Browser): RequestArbiter {
    let arbiter = arbiters.get(browser)
    if (!arbiter) {
        arbiter = new RequestArbiter(browser)
        arbiters.set(browser, arbiter)
    }
    return arbiter
}

// The driver lists every matching intercept in one event and only the first resume command counts.
export class RequestArbiter {
    #browser: WebdriverIO.Browser
    #candidates = new Set<Candidate>()
    /**
     * intercept ids of live and removed candidates: an in-flight request may still list a removed one
     */
    #owned = new Set<string>()
    /**
     * request id → redirect count of a hop answered in `beforeRequestSent`
     */
    #answeredHops = new Map<string, number>()
    #listening = false

    constructor (browser: WebdriverIO.Browser) {
        this.#browser = browser
    }

    add (candidate: Candidate) {
        this.#candidates.add(candidate)
        this.#owned.add(candidate.interceptId)
        if (!this.#listening) {
            this.#listening = true
            this.#browser.on('network.beforeRequestSent', (event) => this.#handle('beforeRequestSent', event))
            this.#browser.on('network.responseStarted', (event) => this.#handle('responseStarted', event))
            this.#browser.on('network.responseCompleted', (event) => this.#forget(event))
            this.#browser.on('network.fetchError', (event) => this.#forget(event))
        }
    }

    remove (candidate: Candidate) {
        this.#candidates.delete(candidate)
    }

    #forget (event: { request: local.NetworkRequestData }) {
        this.#answeredHops.delete(event.request.request)
    }

    #handle (phase: Phase, event: NetworkEvent) {
        const live = [...this.#candidates]
        for (const candidate of live) {
            try {
                candidate.observe(phase, event)
            } catch (err) {
                log.error(`A mock failed to record request ${event.request.request}: ${messageOf(err)}`)
            }
        }

        const requestId = event.request.request
        const answeredHop = this.#answeredHops.get(requestId)
        if (answeredHop !== undefined) {
            this.#answeredHops.delete(requestId)
        }

        if (!event.isBlocked || !event.intercepts?.some((id) => this.#owned.has(id))) {
            return
        }

        // the event of a request answered before it was sent says blocked, but nothing is paused: a call gets 'no such request'
        if (phase === 'responseStarted' && answeredHop !== undefined && answeredHop === event.redirectCount) {
            return
        }

        const intercepts = event.intercepts
        const asked = live.filter((candidate) => intercepts.includes(candidate.interceptId))
        const decisions = asked.map((candidate) => this.#decide(candidate, phase, event))
        if (decisions.some(isPromise)) {
            void Promise.all(decisions)
                .then((settled) => this.#pick(phase, event, asked.map((c, i) => [c, settled[i]])))
                .catch((err) => this.#failPick(requestId, err))
            return
        }
        try {
            this.#pick(phase, event, asked.map((c, i) => [c, decisions[i] as Decision | undefined]))
        } catch (err) {
            this.#failPick(requestId, err)
        }
    }

    #failPick (requestId: string, err: unknown) {
        log.error(`Failed to pick the mock for request ${requestId}, failing it: ${messageOf(err)}`)
        void this.#browser.networkFailRequest({ request: requestId }).catch(this.#onReleaseError)
    }

    #decide (candidate: Candidate, phase: Phase, event: NetworkEvent) {
        const onError = (err: unknown) => {
            log.error(`A mock failed to decide on request ${event.request.request}: ${messageOf(err)}`)
            return undefined
        }
        try {
            const decision = candidate.decide(phase, event)
            return isPromise(decision) ? Promise.resolve(decision).catch(onError) : decision
        } catch (err) {
            return onError(err)
        }
    }

    #pick (phase: Phase, event: NetworkEvent, entries: Entry[]) {
        const requestId = event.request.request
        const decided = entries
            .filter((entry): entry is [Candidate, Decision] => Boolean(entry[1]) && this.#candidates.has(entry[0]))
            .sort(([, a], [, b]) => rank(a, b))

        if (decided.length === 0) {
            return this.#release(phase, requestId)
        }

        const [[, winner], ...losers] = decided
        this.#run(winner, requestId, () => phase === 'beforeRequestSent' && this.#recordAnsweredHop(requestId, event.redirectCount))

        for (const [, loser] of losers) {
            try {
                loser.lose(winner)
            } catch (err) {
                log.error(`A mock failed to give way on request ${requestId}: ${messageOf(err)}`)
            }
        }
    }

    // the record is set before the answer is sent: the next event of the request can come before the reply
    #recordAnsweredHop (requestId: string, redirectCount: number | undefined) {
        if (redirectCount === undefined) {
            return
        }
        this.#answeredHops.set(requestId, redirectCount)
        if (this.#answeredHops.size > MAX_ANSWERED_HOPS) {
            this.#answeredHops.delete(this.#answeredHops.keys().next().value!)
        }
    }

    #run (winner: Decision, requestId: string, answeredEarly: () => void) {
        const onError = (err: unknown) => {
            this.#answeredHops.delete(requestId)
            if (isNoSuchRequest(err)) {
                log.debug(`Request ${requestId} was gone before the mock answered it`)
                return
            }
            log.error(`A mock failed to handle request ${requestId}, failing it: ${messageOf(err)}`)
            return this.#browser.networkFailRequest({ request: requestId }).catch(this.#onReleaseError)
        }
        try {
            void Promise.resolve(winner.run(answeredEarly)).catch(onError)
        } catch (err) {
            void onError(err)
        }
    }

    #release (phase: Phase, requestId: string) {
        const release = phase === 'beforeRequestSent'
            ? this.#browser.networkContinueRequest({ request: requestId })
            : this.#browser.networkProvideResponse({ request: requestId })
        void release.catch(this.#onReleaseError)
    }

    #onReleaseError = (err: unknown) => {
        if (isNoSuchRequest(err)) {
            log.debug(`Request to release is gone: ${messageOf(err)}`)
            return
        }
        logBackgroundError(log, 'Failed to release a paused request', err, this.#browser)
    }
}
