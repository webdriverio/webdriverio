import { EventEmitter } from 'node:events'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
    arbiterOf, rank, type Candidate, type Decision, type NetworkEvent, type Phase
} from '../../../src/utils/interception/arbiter.js'

const { loggerMock } = vi.hoisted(() => ({
    loggerMock: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        trace: vi.fn()
    }
}))

vi.mock('@wdio/logger', () => {
    return {
        default: () => loggerMock
    }
})

type FakeBrowser = EventEmitter & {
    networkContinueRequest: ReturnType<typeof vi.fn>
    networkProvideResponse: ReturnType<typeof vi.fn>
    networkFailRequest: ReturnType<typeof vi.fn>
}

function fakeBrowser () {
    return Object.assign(new EventEmitter(), {
        networkContinueRequest: vi.fn().mockResolvedValue({}),
        networkProvideResponse: vi.fn().mockResolvedValue({}),
        networkFailRequest: vi.fn().mockResolvedValue({})
    }) as FakeBrowser
}

const asBrowser = (browser: FakeBrowser) => browser as unknown as WebdriverIO.Browser

interface EventOptions {
    request?: string
    intercepts?: string[]
    isBlocked?: boolean
    redirectCount?: number
}

function networkEvent ({ request = 'req-1', intercepts = ['int-a', 'int-b'], isBlocked = true, redirectCount = 0 }: EventOptions = {}) {
    return {
        context: 'ctx-1',
        isBlocked,
        navigation: null,
        redirectCount,
        request: { request, url: 'https://example.com/api', method: 'GET', headers: [], cookies: [] },
        timestamp: 0,
        intercepts,
        initiator: {}
    } as unknown as NetworkEvent
}

function emit (browser: FakeBrowser, phase: Phase, options: EventOptions = {}) {
    const event = networkEvent(options)
    browser.emit(`network.${phase}`, event)
    return event
}

interface FakeDecision extends Decision {
    run: ReturnType<typeof vi.fn> & Decision['run']
    lose: ReturnType<typeof vi.fn> & Decision['lose']
}

// a run that answers in `beforeRequestSent`, as `network.provideResponse` does there
function answersEarly (result: () => Promise<unknown> = () => Promise.resolve()) {
    return vi.fn((answeredEarly: () => void) => {
        answeredEarly()
        return result()
    })
}

function decision (kind: Decision['kind'], options: Partial<Decision> = {}): FakeDecision {
    return {
        kind,
        scoped: false,
        age: 0,
        run: vi.fn().mockResolvedValue(undefined),
        lose: vi.fn(),
        ...options
    } as FakeDecision
}

type Decide = Candidate['decide']

interface FakeCandidate extends Candidate {
    observe: ReturnType<typeof vi.fn> & Candidate['observe']
    decide: ReturnType<typeof vi.fn> & Decide
}

function candidate (age: number, interceptId: string, decide: Decide = () => undefined): FakeCandidate {
    return {
        age,
        interceptId,
        observe: vi.fn(),
        decide: vi.fn(decide)
    } as FakeCandidate
}

function deferred<T> () {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((res) => { resolve = res })
    return { promise, resolve }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const bidiCalls = (browser: FakeBrowser) => (
    browser.networkContinueRequest.mock.calls.length +
    browser.networkProvideResponse.mock.calls.length +
    browser.networkFailRequest.mock.calls.length
)

describe('RequestArbiter', () => {
    let browser: FakeBrowser

    beforeEach(() => {
        vi.clearAllMocks()
        browser = fakeBrowser()
    })

    it('releases a blocked request once with the winner\'s call', async () => {
        const passOld = decision('pass', { age: 1 })
        const answer = decision('answer', { age: 2 })
        const passScoped = decision('pass', { age: 3, scoped: true })
        const a = candidate(1, 'int-a', () => passOld)
        const b = candidate(2, 'int-b', () => answer)
        const c = candidate(3, 'int-c', () => passScoped)
        const other = candidate(4, 'int-other', () => decision('answer', { age: 4 }))
        const arbiter = arbiterOf(asBrowser(browser))
        for (const each of [a, b, c, other]) {
            arbiter.add(each)
        }

        emit(browser, 'beforeRequestSent', { intercepts: ['int-a', 'int-b', 'int-c'] })
        await flush()

        expect(answer.run).toHaveBeenCalledTimes(1)
        expect(answer.lose).not.toHaveBeenCalled()
        expect(passOld.run).not.toHaveBeenCalled()
        expect(passOld.lose).toHaveBeenCalledTimes(1)
        expect(passOld.lose).toHaveBeenCalledWith(answer)
        expect(passScoped.run).not.toHaveBeenCalled()
        expect(passScoped.lose).toHaveBeenCalledWith(answer)
        expect(other.decide).not.toHaveBeenCalled()
        expect(other.observe).toHaveBeenCalledTimes(1)
        expect(bidiCalls(browser)).toBe(0)
    })

    it('releases a request with one candidate in the same tick', () => {
        const run = vi.fn(() => browser.networkContinueRequest({ request: 'req-1' }))
        const only = candidate(1, 'int-a', () => decision('pass', { age: 1, run }))
        arbiterOf(asBrowser(browser)).add(only)

        emit(browser, 'beforeRequestSent', { intercepts: ['int-a'] })

        expect(run).toHaveBeenCalledTimes(1)
        expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 'req-1' })
    })

    it('releases a request in the same tick when its one candidate does not decide', () => {
        arbiterOf(asBrowser(browser)).add(candidate(1, 'int-a'))

        emit(browser, 'beforeRequestSent', { intercepts: ['int-a'] })

        expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 'req-1' })
    })

    it('decides again at responseStarted the candidates that lost beforeRequestSent', async () => {
        const defer = decision('defer', { age: 1 })
        const passFirst = decision('pass', { age: 2 })
        const answerLater = decision('answer', { age: 2 })
        const a = candidate(1, 'int-a', (phase) => phase === 'beforeRequestSent' ? defer : undefined)
        const b = candidate(2, 'int-b', (phase) => phase === 'beforeRequestSent' ? passFirst : answerLater)
        const arbiter = arbiterOf(asBrowser(browser))
        arbiter.add(a)
        arbiter.add(b)

        emit(browser, 'beforeRequestSent')
        await flush()
        expect(defer.run).toHaveBeenCalledTimes(1)
        expect(passFirst.lose).toHaveBeenCalledTimes(1)

        emit(browser, 'responseStarted')
        await flush()
        expect(b.decide).toHaveBeenCalledTimes(2)
        expect(b.decide).toHaveBeenLastCalledWith('responseStarted', expect.anything())
        expect(answerLater.run).toHaveBeenCalledTimes(1)
        expect(passFirst.run).not.toHaveBeenCalled()
        expect(bidiCalls(browser)).toBe(0)
    })

    describe('rank', () => {
        const winnerOf = (a: Decision, b: Decision) => rank(a, b) < 0 ? 'a' : 'b'

        it.each([
            ['session-wide answer vs scoped pass', decision('answer'), decision('pass', { scoped: true, age: -1 }), 'a'],
            ['scoped defer vs session-wide answer', decision('defer', { scoped: true, age: 5 }), decision('answer', { age: 1 }), 'a'],
            ['two session-wide, pass vs defer', decision('pass', { age: 1 }), decision('defer', { age: 2 }), 'b'],
            ['two session-wide answers, older first', decision('answer', { age: 1 }), decision('answer', { age: 2 }), 'a'],
            ['two scoped passes, younger first', decision('pass', { scoped: true, age: 7 }), decision('pass', { scoped: true, age: 3 }), 'b'],
            ['answer vs defer, same scope, older defer', decision('answer', { age: 4 }), decision('defer', { age: 2 }), 'b']
        ] as const)('%s', (_, a, b, expected) => {
            expect(winnerOf(a, b)).toBe(expected)
        })

        const kinds = ['answer', 'defer', 'pass'] as const
        const scopes = [true, false]
        const ages = [[1, 2], [2, 1]] as const
        const classes = kinds.flatMap((kindA) => kinds.flatMap((kindB) => scopes.flatMap((scopedA) => scopes.flatMap(
            (scopedB) => ages.map(([ageA, ageB]) => ({ kindA, kindB, scopedA, scopedB, ageA, ageB }))
        ))))
        /** Sort key: acts beats lets through, then scoped beats session-wide, then older. */
        const key = (d: Decision) => [d.kind === 'pass' ? 1 : 0, d.scoped ? 0 : 1, d.age]
        const expectedWinner = (a: Decision, b: Decision) => {
            const [ka, kb] = [key(a), key(b)]
            const index = ka.findIndex((value, i) => value !== kb[i])
            return ka[index] < kb[index] ? 'a' : 'b'
        }

        it.each(classes)('$kindA/$scopedA/$ageA vs $kindB/$scopedB/$ageB', ({ kindA, kindB, scopedA, scopedB, ageA, ageB }) => {
            const a = decision(kindA, { scoped: scopedA, age: ageA })
            const b = decision(kindB, { scoped: scopedB, age: ageB })
            expect(winnerOf(a, b)).toBe(expectedWinner(a, b))
            expect(Math.sign(rank(a, b))).toBe(-Math.sign(rank(b, a)))
        })

        it('ranks answer and defer equal before scope and age', () => {
            expect(rank(decision('answer', { age: 1 }), decision('defer', { age: 1 }))).toBe(0)
        })
    })

    it.each([
        ['beforeRequestSent', 'networkContinueRequest'],
        ['responseStarted', 'networkProvideResponse']
    ] as const)('continues the request when no candidate decides (%s)', async (phase, command) => {
        browser[command].mockRejectedValue(new Error('WebDriver Bidi command failed: no such request'))
        const arbiter = arbiterOf(asBrowser(browser))
        arbiter.add(candidate(1, 'int-a'))
        arbiter.add(candidate(2, 'int-b'))

        emit(browser, phase)
        await flush()

        expect(browser[command]).toHaveBeenCalledTimes(1)
        expect(browser[command]).toHaveBeenCalledWith({ request: 'req-1' })
        expect(bidiCalls(browser)).toBe(1)
        expect(loggerMock.warn).not.toHaveBeenCalled()
        expect(loggerMock.error).not.toHaveBeenCalled()
    })

    it('logs a release error that is not "no such request"', async () => {
        browser.networkContinueRequest.mockRejectedValue(new Error('unknown error'))
        arbiterOf(asBrowser(browser)).add(candidate(1, 'int-a'))

        emit(browser, 'beforeRequestSent', { intercepts: ['int-a'] })
        await flush()

        expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('unknown error'))
    })

    it('waits for async decisions before it picks', async () => {
        const pass = decision('pass', { age: 1 })
        const answer = decision('answer', { age: 2 })
        const later = deferred<Decision | undefined>()
        const arbiter = arbiterOf(asBrowser(browser))
        arbiter.add(candidate(1, 'int-a', () => pass))
        arbiter.add(candidate(2, 'int-b', () => later.promise))

        emit(browser, 'beforeRequestSent')
        await flush()
        expect(pass.run).not.toHaveBeenCalled()
        expect(pass.lose).not.toHaveBeenCalled()
        expect(bidiCalls(browser)).toBe(0)

        later.resolve(answer)
        await flush()
        expect(answer.run).toHaveBeenCalledTimes(1)
        expect(pass.lose).toHaveBeenCalledTimes(1)
        expect(pass.run).not.toHaveBeenCalled()
        expect(bidiCalls(browser)).toBe(0)
    })

    it('treats a rejected decision as no decision', async () => {
        const pass = decision('pass', { age: 2 })
        const arbiter = arbiterOf(asBrowser(browser))
        arbiter.add(candidate(1, 'int-a', () => Promise.reject(new Error('getData failed'))))
        arbiter.add(candidate(2, 'int-b', () => pass))

        emit(browser, 'beforeRequestSent')
        await flush()

        expect(pass.run).toHaveBeenCalledTimes(1)
    })

    it('observes a request that is not blocked, and releases nothing', async () => {
        const a = candidate(1, 'int-a', () => decision('answer'))
        const b = candidate(2, 'int-b', () => decision('answer'))
        const arbiter = arbiterOf(asBrowser(browser))
        arbiter.add(a)
        arbiter.add(b)

        const before = emit(browser, 'beforeRequestSent', { isBlocked: false })
        const started = emit(browser, 'responseStarted', { isBlocked: false })
        await flush()

        for (const each of [a, b]) {
            expect(each.observe).toHaveBeenCalledTimes(2)
            expect(each.observe).toHaveBeenNthCalledWith(1, 'beforeRequestSent', before)
            expect(each.observe).toHaveBeenNthCalledWith(2, 'responseStarted', started)
            expect(each.decide).not.toHaveBeenCalled()
        }
        expect(bidiCalls(browser)).toBe(0)
    })

    it('ignores a blocked request whose intercepts are all unknown', async () => {
        const a = candidate(1, 'int-a', () => decision('answer'))
        arbiterOf(asBrowser(browser)).add(a)

        emit(browser, 'beforeRequestSent', { intercepts: ['int-foreign'] })
        emit(browser, 'responseStarted', { intercepts: ['int-foreign'] })
        await flush()

        expect(a.observe).toHaveBeenCalledTimes(2)
        expect(a.decide).not.toHaveBeenCalled()
        expect(bidiCalls(browser)).toBe(0)
    })

    it.each([
        ['beforeRequestSent', 'networkContinueRequest'],
        ['responseStarted', 'networkProvideResponse']
    ] as const)('releases a request blocked only by a removed candidate\'s intercept (%s)', async (phase, command) => {
        const removed = candidate(1, 'int-a', () => decision('answer'))
        const live = candidate(2, 'int-b', () => decision('answer'))
        const arbiter = arbiterOf(asBrowser(browser))
        arbiter.add(removed)
        arbiter.add(live)
        arbiter.remove(removed)

        emit(browser, phase, { intercepts: ['int-a'] })
        await flush()

        expect(removed.decide).not.toHaveBeenCalled()
        expect(removed.observe).not.toHaveBeenCalled()
        expect(live.decide).not.toHaveBeenCalled()
        expect(browser[command]).toHaveBeenCalledWith({ request: 'req-1' })
        expect(bidiCalls(browser)).toBe(1)
    })

    describe('when the winner\'s run fails', () => {
        let unhandled: ReturnType<typeof vi.fn>

        beforeEach(() => {
            unhandled = vi.fn()
            process.on('unhandledRejection', unhandled)
        })

        afterEach(() => {
            process.off('unhandledRejection', unhandled)
        })

        it.each([
            ['throws', () => { throw new Error('bad overwrite') }],
            ['rejects', () => Promise.reject(new Error('bad overwrite'))]
        ])('fails the request and logs when the winner\'s run %s', async (_, run) => {
            browser.networkFailRequest.mockRejectedValue(new Error('no such request'))
            const answer = decision('answer', { age: 1, run: vi.fn(run) })
            const pass = decision('pass', { age: 2 })
            const arbiter = arbiterOf(asBrowser(browser))
            arbiter.add(candidate(1, 'int-a', () => answer))
            arbiter.add(candidate(2, 'int-b', () => pass))

            emit(browser, 'beforeRequestSent')
            await flush()

            expect(answer.run).toHaveBeenCalledTimes(1)
            expect(pass.lose).toHaveBeenCalledTimes(1)
            expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 'req-1' })
            expect(bidiCalls(browser)).toBe(1)
            expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('bad overwrite'))
            expect(unhandled).not.toHaveBeenCalled()
        })

        it('does not fail a request that is already gone', async () => {
            const answer = decision('answer', { run: vi.fn().mockRejectedValue(new Error('no such request')) })
            arbiterOf(asBrowser(browser)).add(candidate(1, 'int-a', () => answer))

            emit(browser, 'beforeRequestSent', { intercepts: ['int-a'] })
            await flush()

            expect(browser.networkFailRequest).not.toHaveBeenCalled()
            expect(loggerMock.error).not.toHaveBeenCalled()
            expect(unhandled).not.toHaveBeenCalled()
        })

        it.each([
            ['at once', (value: Decision) => value],
            ['after a wait', (value: Decision) => Promise.resolve(value)]
        ])('fails the request and logs when picking the winner throws %s', async (_, settle) => {
            const broken = decision('answer', { age: 1 })
            Object.defineProperty(broken, 'kind', { get () { throw new Error('broken pick') } })
            const answer = decision('answer', { age: 2 })
            const arbiter = arbiterOf(asBrowser(browser))
            arbiter.add(candidate(1, 'int-a', () => settle(broken)))
            arbiter.add(candidate(2, 'int-b', () => answer))

            expect(() => emit(browser, 'beforeRequestSent')).not.toThrow()
            await flush()

            expect(broken.run).not.toHaveBeenCalled()
            expect(answer.run).not.toHaveBeenCalled()
            expect(browser.networkFailRequest).toHaveBeenCalledWith({ request: 'req-1' })
            expect(bidiCalls(browser)).toBe(1)
            expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('broken pick'))
            expect(unhandled).not.toHaveBeenCalled()
        })

        it('keeps releasing when observe or decide throws', async () => {
            const broken = candidate(1, 'int-a', () => { throw new Error('broken decide') })
            broken.observe.mockImplementation(() => { throw new Error('broken observe') })
            const pass = decision('pass', { age: 2 })
            const arbiter = arbiterOf(asBrowser(browser))
            arbiter.add(broken)
            arbiter.add(candidate(2, 'int-b', () => pass))

            emit(browser, 'beforeRequestSent')
            await flush()

            expect(pass.run).toHaveBeenCalledTimes(1)
            expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('broken decide'))
            expect(loggerMock.error).toHaveBeenCalledWith(expect.stringContaining('broken observe'))
            expect(unhandled).not.toHaveBeenCalled()
        })
    })

    it('drops the decision of a candidate removed while the event is open, and still releases the request', async () => {
        const answer = decision('answer', { age: 1 })
        const pass = decision('pass', { age: 2 })
        const later = deferred<Decision | undefined>()
        const removed = candidate(1, 'int-a', () => later.promise)
        const arbiter = arbiterOf(asBrowser(browser))
        arbiter.add(removed)
        arbiter.add(candidate(2, 'int-b', () => pass))

        emit(browser, 'beforeRequestSent')
        arbiter.remove(removed)
        later.resolve(answer)
        await flush()

        expect(answer.run).not.toHaveBeenCalled()
        expect(answer.lose).not.toHaveBeenCalled()
        expect(pass.run).toHaveBeenCalledTimes(1)
        expect(bidiCalls(browser)).toBe(0)
    })

    it('continues the request when the only deciding candidate is removed while the event is open', async () => {
        const answer = decision('answer', { age: 1 })
        const later = deferred<Decision | undefined>()
        const removed = candidate(1, 'int-a', () => later.promise)
        const arbiter = arbiterOf(asBrowser(browser))
        arbiter.add(removed)
        arbiter.add(candidate(2, 'int-b'))

        emit(browser, 'beforeRequestSent')
        arbiter.remove(removed)
        later.resolve(answer)
        await flush()

        expect(answer.run).not.toHaveBeenCalled()
        expect(browser.networkContinueRequest).toHaveBeenCalledWith({ request: 'req-1' })
        expect(bidiCalls(browser)).toBe(1)
    })

    it('keeps one arbiter per browser object', async () => {
        const second = fakeBrowser()
        expect(arbiterOf(asBrowser(browser))).toBe(arbiterOf(asBrowser(browser)))
        expect(arbiterOf(asBrowser(browser))).not.toBe(arbiterOf(asBrowser(second)))

        const first = candidate(1, 'int-a', () => decision('answer'))
        arbiterOf(asBrowser(browser)).add(first)
        arbiterOf(asBrowser(second)).add(candidate(1, 'int-b'))

        emit(second, 'beforeRequestSent', { intercepts: ['int-a', 'int-b'] })
        await flush()

        expect(first.observe).not.toHaveBeenCalled()
        expect(first.decide).not.toHaveBeenCalled()
        expect(second.networkContinueRequest).toHaveBeenCalledWith({ request: 'req-1' })
        expect(bidiCalls(browser)).toBe(0)
    })

    describe('early answer', () => {
        function answerEarly () {
            const early = decision('answer', { age: 1, run: answersEarly() })
            const a = candidate(1, 'int-a', (phase, event) => (
                phase === 'beforeRequestSent' && event.redirectCount === 0 ? early : undefined
            ))
            const b = candidate(2, 'int-b', () => decision('pass', { age: 2 }))
            const arbiter = arbiterOf(asBrowser(browser))
            arbiter.add(a)
            arbiter.add(b)
            emit(browser, 'beforeRequestSent')
            expect(early.run).toHaveBeenCalledTimes(1)
            return { a, b }
        }

        it('sends nothing at the responseStarted of an answered hop only', async () => {
            const { a, b } = answerEarly()

            emit(browser, 'responseStarted')
            await flush()
            expect(bidiCalls(browser)).toBe(0)
            expect(a.decide).toHaveBeenCalledTimes(1)
            expect(b.decide).toHaveBeenCalledTimes(1)
            expect(a.observe).toHaveBeenCalledTimes(2)
            expect(loggerMock.warn).not.toHaveBeenCalled()

            emit(browser, 'beforeRequestSent', { redirectCount: 1 })
            emit(browser, 'responseStarted', { redirectCount: 1 })
            await flush()
            expect(a.decide).toHaveBeenLastCalledWith('responseStarted', expect.objectContaining({ redirectCount: 1 }))
            expect(b.decide).toHaveBeenLastCalledWith('responseStarted', expect.objectContaining({ redirectCount: 1 }))
        })

        it('decides the responseStarted of another hop of an answered request', async () => {
            const { a, b } = answerEarly()

            emit(browser, 'responseStarted', { redirectCount: 1 })
            await flush()

            expect(a.decide).toHaveBeenLastCalledWith('responseStarted', expect.objectContaining({ redirectCount: 1 }))
            expect(b.decide).toHaveBeenLastCalledWith('responseStarted', expect.objectContaining({ redirectCount: 1 }))
        })

        it('asks the candidates for a response with no redirect count and no early answer', async () => {
            const answer = decision('answer', { age: 1 })
            const a = candidate(1, 'int-a', () => answer)
            arbiterOf(asBrowser(browser)).add(a)

            const event = networkEvent({ intercepts: ['int-a'] }) as NetworkEvent & { redirectCount?: number }
            delete event.redirectCount
            browser.emit('network.responseStarted', event)
            await flush()

            expect(answer.run).toHaveBeenCalledTimes(1)
            expect(bidiCalls(browser)).toBe(0)
        })

        it('does not record a hop when the winner\'s run did not answer early', async () => {
            const answer = decision('answer', { age: 1 })
            const a = candidate(1, 'int-a', () => answer)
            arbiterOf(asBrowser(browser)).add(a)

            emit(browser, 'beforeRequestSent', { intercepts: ['int-a'] })
            emit(browser, 'responseStarted', { intercepts: ['int-a'] })
            await flush()

            expect(a.decide).toHaveBeenCalledTimes(2)
            expect(answer.run).toHaveBeenCalledTimes(2)
        })

        it('records the hop before the early answer is sent', async () => {
            let recordedBeforeSend = false
            const early = decision('answer', {
                age: 1,
                run: answersEarly(async () => {
                    // the next event of the request arrives before the reply of the answer
                    emit(browser, 'responseStarted', { intercepts: ['int-a'] })
                    recordedBeforeSend = a.decide.mock.calls.length === 1
                })
            })
            const a = candidate(1, 'int-a', (phase) => phase === 'beforeRequestSent' ? early : undefined)
            arbiterOf(asBrowser(browser)).add(a)

            emit(browser, 'beforeRequestSent', { intercepts: ['int-a'] })
            await flush()

            expect(recordedBeforeSend).toBe(true)
            expect(a.decide).toHaveBeenCalledTimes(1)
        })

        it('records an early answer in beforeRequestSent only', async () => {
            const answer = decision('answer', { age: 1, run: answersEarly() })
            const a = candidate(1, 'int-a', (phase) => phase === 'responseStarted' ? answer : undefined)
            arbiterOf(asBrowser(browser)).add(a)

            emit(browser, 'responseStarted', { intercepts: ['int-a'] })
            emit(browser, 'responseStarted', { intercepts: ['int-a'] })
            await flush()

            expect(a.decide).toHaveBeenCalledTimes(2)
            expect(answer.run).toHaveBeenCalledTimes(2)
        })

        it('removes the record after use', async () => {
            const { a } = answerEarly()

            emit(browser, 'responseStarted')
            emit(browser, 'responseStarted')
            await flush()

            expect(a.decide).toHaveBeenCalledTimes(2)
            expect(a.decide).toHaveBeenLastCalledWith('responseStarted', expect.anything())
        })

        it('does not apply the rule to another request', async () => {
            const { a } = answerEarly()

            emit(browser, 'responseStarted', { request: 'req-2' })
            await flush()

            expect(a.decide).toHaveBeenLastCalledWith('responseStarted', expect.objectContaining({
                request: expect.objectContaining({ request: 'req-2' })
            }))
        })

        it.each(['network.responseCompleted', 'network.fetchError'])('forgets the record after %s', async (eventName) => {
            const { a } = answerEarly()

            browser.emit(eventName, networkEvent({ isBlocked: false, intercepts: [] }))
            emit(browser, 'responseStarted')
            await flush()

            expect(a.decide).toHaveBeenCalledTimes(2)
        })

        it('keeps a bounded number of records', async () => {
            const early = decision('answer', { age: 1, run: answersEarly() })
            const a = candidate(1, 'int-a', (phase) => phase === 'beforeRequestSent' ? early : undefined)
            arbiterOf(asBrowser(browser)).add(a)

            for (let i = 0; i <= 1000; i++) {
                emit(browser, 'beforeRequestSent', { request: `req-${i}`, intercepts: ['int-a'] })
            }
            emit(browser, 'responseStarted', { request: 'req-0', intercepts: ['int-a'] })
            emit(browser, 'responseStarted', { request: 'req-1', intercepts: ['int-a'] })
            await flush()

            expect(a.decide).toHaveBeenCalledTimes(1002)
            expect(a.decide).toHaveBeenLastCalledWith('responseStarted', expect.objectContaining({
                request: expect.objectContaining({ request: 'req-0' })
            }))
        })

        it('forgets the record when the answer fails', async () => {
            const early = decision('answer', { age: 1, run: answersEarly(() => Promise.reject(new Error('bad body'))) })
            const a = candidate(1, 'int-a', (phase) => phase === 'beforeRequestSent' ? early : undefined)
            arbiterOf(asBrowser(browser)).add(a)

            emit(browser, 'beforeRequestSent', { intercepts: ['int-a'] })
            await flush()
            emit(browser, 'responseStarted', { intercepts: ['int-a'] })
            await flush()

            expect(a.decide).toHaveBeenCalledTimes(2)
        })

        it('does not record an early answer that lost', async () => {
            const early = decision('answer', { age: 2, run: answersEarly() })
            const scoped = decision('defer', { age: 1, scoped: true })
            const a = candidate(1, 'int-a', (phase) => phase === 'beforeRequestSent' ? scoped : undefined)
            const b = candidate(2, 'int-b', (phase) => phase === 'beforeRequestSent' ? early : undefined)
            const arbiter = arbiterOf(asBrowser(browser))
            arbiter.add(a)
            arbiter.add(b)

            emit(browser, 'beforeRequestSent')
            emit(browser, 'responseStarted')
            await flush()

            expect(early.lose).toHaveBeenCalledTimes(1)
            expect(a.decide).toHaveBeenCalledTimes(2)
            expect(browser.networkProvideResponse).toHaveBeenCalledWith({ request: 'req-1' })
        })
    })
})
