import {
    describe,
    expect,
    it,
    vi,
    beforeAll,
    beforeEach,
    afterEach,
} from 'vitest'
import { EventEmitter } from 'node:events'
import type { TestStepFinished, TestStepStarted } from '@cucumber/messages'
import { TestStepResultStatus } from '@cucumber/messages'
import path from 'node:path'

import CucumberFormatter from '../src/cucumberFormatter.js'

import {
    gherkinDocument,
    pickle,
    testRunStarted,
    testCase,
    testCaseStarted,
    testStepStarted,
    testStepFinished,
    testCaseFinished,
    testRunFinished,
} from './fixtures/envelopes.js'

vi.mock('@cucumber/messages', () => ({
    IdGenerator: { incrementing: vi.fn() },
    TestStepResultStatus: {
        UNKNOWN: 'UNKNOWN',
        PASSED: 'PASSED',
        SKIPPED: 'SKIPPED',
        PENDING: 'PENDING',
        UNDEFINED: 'UNDEFINED',
        AMBIGUOUS: 'AMBIGUOUS',
        FAILED: 'FAILED',
    },
}))

const wdioReporter = {
    write: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
}

const _eventEmitter = {
    write: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
}

const cid = '0-1'
const specs = ['/foobar.js']

const gherkinDocEvent = gherkinDocument
const relativeGherkinDocPath = `.${gherkinDocument.uri}`

const loadGherkin = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { gherkinDocument })
const loadRelativeGherkinPath = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { gherkinDocument: { ...gherkinDocument, uri: relativeGherkinDocPath } })
const acceptPickle = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { pickle })
const prepareSuite = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { testCase })
const startSuite = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { testCaseStarted })

describe('CucumberFormatter', () => {
    describe('emits messages for certain cucumber events', () => {
        let eventBroadcaster: EventEmitter

        beforeEach(() => {
            wdioReporter.emit.mockClear()
            _eventEmitter.emit.mockClear()
            eventBroadcaster = new EventEmitter()
            new CucumberFormatter({
                eventBroadcaster: eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: _eventEmitter,
                    _scenarioLevelReporter: false,
                    _tagsInTitle: false,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: true,
                },
            } as any)
        })

        it('should not send any data on `gherkin-document` event', () => {
            loadGherkin(eventBroadcaster)
            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should return absolute uri on `gherkin-document` event', () => {
            loadRelativeGherkinPath(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testRunStarted: {} })
            expect(wdioReporter.emit).toHaveBeenCalledWith('suite:start', expect.objectContaining({
                file: path.resolve(relativeGherkinDocPath),
            }))
        })

        it('should send proper data on `test-run-started` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testRunStarted: {} })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should not send any data on `pickle-accepted` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            acceptPickle(eventBroadcaster)
            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it("should send accepted pickle's data on `test-case-started` event", () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            wdioReporter.emit.mockClear()
            startSuite(eventBroadcaster)
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        describe('step finished events', () => {
            beforeEach(() => {
                loadGherkin(eventBroadcaster)
                acceptPickle(eventBroadcaster)
                prepareSuite(eventBroadcaster)
                startSuite(eventBroadcaster)
                wdioReporter.emit.mockClear()
            })

            it('should send proper data on `test-step-started` event', () => {
                eventBroadcaster.emit('envelope', { testStepStarted })
                expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
            })

            it('passed step', () => {
                const passingStep: TestStepFinished = JSON.parse(
                    JSON.stringify(testStepFinished)
                )
                eventBroadcaster.emit('envelope', {
                    testStepFinished: passingStep,
                })
                delete wdioReporter.emit.mock.calls[0][1].duration
                expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
            })

            it('failed step', () => {
                const failedStep: TestStepFinished = JSON.parse(
                    JSON.stringify(testStepFinished)
                )
                failedStep.testStepResult = {
                    ...failedStep.testStepResult,
                    status: TestStepResultStatus.FAILED,
                }
                eventBroadcaster.emit('envelope', {
                    testStepFinished: failedStep,
                })
                delete wdioReporter.emit.mock.calls[0][1].duration
                expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
            })
        })

        it('should send proper data on onTestRunFinished', () => {
            const passingStep: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', {
                testStepFinished: passingStep,
            })
            eventBroadcaster.emit('envelope', { testCaseFinished })
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('envelope', { testRunFinished })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should proper data when executing a hook', () => {
            const hookStarted: TestStepStarted = JSON.parse(
                JSON.stringify(testStepStarted)
            )
            hookStarted.testStepId = '24'
            const hookFinished: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )
            hookFinished.testStepId = '24'

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted: hookStarted })
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', {
                testStepFinished: hookFinished,
            })
            delete wdioReporter.emit.mock.calls[0][1].duration
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should emit proper no of hookparams events', () => {
            loadGherkin(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', { testCaseFinished })
            expect(_eventEmitter.emit).toBeCalledTimes(4)
            Array(4).fill(0).forEach((_, i) => expect(_eventEmitter.emit).toHaveBeenNthCalledWith(i+1, 'getHookParams', expect.any(Object)))

        })
    })

    describe('emits messages for certain cucumber events when executed in scenarioLeverReporter', () => {
        let eventBroadcaster: EventEmitter

        beforeEach(() => {
            wdioReporter.emit.mockClear()
            eventBroadcaster = new EventEmitter()
            new CucumberFormatter({
                eventBroadcaster: eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: new EventEmitter(),
                    _scenarioLevelReporter: true,
                    _tagsInTitle: false,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: true,
                },
            } as any)
        })

        it('should send proper data on `test-run-started` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testRunStarted })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it("should send accepted pickle's data on `test-case-started` event", () => {
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            wdioReporter.emit.mockClear()
            startSuite(eventBroadcaster)

            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should send proper data on `test-case-finished` event', () => {
            const passingStep: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', {
                testStepFinished: passingStep,
            })
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('envelope', { testCaseFinished })
            delete wdioReporter.emit.mock.calls[0][1].duration
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should send proper data on onTestRunFinished', () => {
            const passingStep: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', {
                testStepFinished: passingStep,
            })
            eventBroadcaster.emit('envelope', { testCaseFinished })
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('envelope', { testRunFinished })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        /**
         * the scenario is the test: its end event has the title, type and parent of
         * its start event, also when the scenario is pending
         */
        function finishScenarioWith (status: string) {
            const step: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
            ;(step.testStepResult as { status: string }).status = status
            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            const [, started] = wdioReporter.emit.mock.calls.find(([event]: [string]) => event === 'test:start')
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', { testStepFinished: step })
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testCaseFinished })
            return { started, finished: wdioReporter.emit.mock.calls[0] }
        }

        it('keeps the scenario title of a pending scenario', () => {
            const { started, finished: [event, payload] } = finishScenarioWith('PENDING')
            expect(event).toBe('test:pending')
            expect(payload).toMatchObject({ uid: started.uid, title: 'Get size of an element', type: 'scenario', parent: started.parent })
        })

        it('names the scenario in the error of an undefined step', () => {
            const { finished: [event, payload] } = finishScenarioWith('UNDEFINED')
            expect(event).toBe('test:fail')
            expect(payload.title).toBe('Get size of an element')
            expect(payload.error.message).toContain('Scenario Get size of an element has undefined steps.')
        })
    })

    describe('provides a fail counter', () => {
        function reportedFailedCount (status: TestStepResultStatus, ignoreUndefinedDefinitions = false) {
            const eventBroadcaster = new EventEmitter()
            const events = new EventEmitter()
            const counts: unknown[] = []
            events.on('getFailedCount', (count) => counts.push(count))
            new CucumberFormatter({
                eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: events,
                    _scenarioLevelReporter: false,
                    _tagsInTitle: false,
                    _ignoreUndefinedDefinitions: ignoreUndefinedDefinitions,
                    _failAmbiguousDefinitions: true,
                },
            } as any)

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)

            const step: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
            step.testStepResult = {
                ...step.testStepResult,
                status,
            }
            eventBroadcaster.emit('envelope', { testStepFinished: step })
            eventBroadcaster.emit('envelope', { testRunFinished })
            return counts
        }

        it('should increment failed counter on `failed` status', () => {
            expect(reportedFailedCount(TestStepResultStatus.FAILED)).toEqual([1])
        })

        it('should increment failed counter on `ambiguous` status', () => {
            expect(reportedFailedCount(TestStepResultStatus.AMBIGUOUS)).toEqual([1])
        })

        it('should increment failed counter on `undefined` status', () => {
            expect(reportedFailedCount(TestStepResultStatus.UNDEFINED)).toEqual([1])
        })

        it('should not increment failed counter on `undefined` status if ignoreUndefinedDefinitions set to true', () => {
            expect(reportedFailedCount(TestStepResultStatus.UNDEFINED, true)).toEqual([0])
        })
    })

    describe('tags in title', () => {
        let eventBroadcaster: EventEmitter

        beforeAll(() => {
            eventBroadcaster = new EventEmitter()
            new CucumberFormatter({
                eventBroadcaster: eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: new EventEmitter(),
                    _scenarioLevelReporter: false,
                    _tagsInTitle: true,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: false,
                },
            } as any)
        })

        it('should add tags on handleBeforeFeatureEvent', () => {
            eventBroadcaster.emit('envelope', {
                gherkinDocument: gherkinDocEvent,
            })
            expect(wdioReporter.emit).not.toBeCalled()
            eventBroadcaster.emit('envelope', { testRunStarted })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })
    })

    afterEach(() => {
        wdioReporter.on.mockClear()
        wdioReporter.write.mockClear()
        wdioReporter.emit.mockClear()
    })

    describe('grouped specs in a random order (A/B/A)', () => {
        afterEach(() => {
            vi.useRealTimers()
        })

        /**
         * 2 feature files in one worker, and their scenarios in the order a1, b1, a2,
         * each scenario takes 10 ms
         */
        function runGroupedFeatures (scenarioLevelReporter: boolean) {
            vi.useFakeTimers({ toFake: ['Date'] })
            vi.setSystemTime(0)
            wdioReporter.emit.mockClear()
            const eventBroadcaster = new EventEmitter()
            new CucumberFormatter({
                eventBroadcaster,
                parsedArgvOptions: {
                    _reporter: wdioReporter,
                    _cid: cid,
                    _specs: specs,
                    _eventEmitter: new EventEmitter(),
                    _scenarioLevelReporter: scenarioLevelReporter,
                    _tagsInTitle: false,
                    _ignoreUndefinedDefinitions: false,
                    _failAmbiguousDefinitions: true,
                },
            } as any)
            const doc = (name: string) => ({ ...gherkinDocument, uri: `/features/${name}.feature`, feature: { ...gherkinDocument.feature!, name: `Feature ${name}` } })
            const scenario = (name: string, uri: string) => ({ ...pickle, id: `pickle-${name}`, name, uri })
            for (const gherkin of [doc('a'), doc('b')]) {
                eventBroadcaster.emit('envelope', { gherkinDocument: gherkin })
            }
            eventBroadcaster.emit('envelope', { testRunStarted })
            for (const [name, uri] of [['a1', '/features/a.feature'], ['b1', '/features/b.feature'], ['a2', '/features/a.feature']]) {
                eventBroadcaster.emit('envelope', { pickle: scenario(name, uri) })
                eventBroadcaster.emit('envelope', { testCase: { ...testCase, id: `case-${name}`, pickleId: `pickle-${name}` } })
            }
            for (const name of ['a1', 'b1', 'a2']) {
                eventBroadcaster.emit('envelope', { testCaseStarted: { ...testCaseStarted, testCaseId: `case-${name}` } })
                vi.advanceTimersByTime(10)
                if (scenarioLevelReporter) {
                    // the result of the scenario test comes from the results of its steps
                    eventBroadcaster.emit('envelope', { testStepFinished })
                }
                eventBroadcaster.emit('envelope', { testCaseFinished })
            }
            eventBroadcaster.emit('envelope', { testRunFinished })
            return wdioReporter.emit.mock.calls
                .filter(([event]: [string]) => /^(suite|test):(start|end|pass)$/.test(event))
                .map(([event, payload]: [string, any]) => ({ event, type: payload.type, title: payload.title, uid: payload.uid, parent: payload.parent, duration: payload.duration }))
        }

        it('starts a feature again when the run comes back to it, with its own uid', () => {
            const events = runGroupedFeatures(false)
            const a = 'a.feature:3:1'
            const b = 'b.feature:3:1'
            expect(events.map(({ event, type, uid, parent }) => [event, type, type === 'feature' ? uid : parent])).toEqual([
                ['suite:start', 'feature', a],
                ['suite:start', 'scenario', a],
                ['suite:end', 'scenario', a],
                ['suite:end', 'feature', a],
                ['suite:start', 'feature', b],
                ['suite:start', 'scenario', b],
                ['suite:end', 'scenario', b],
                ['suite:end', 'feature', b],
                ['suite:start', 'feature', `${a}#2`],
                ['suite:start', 'scenario', `${a}#2`],
                ['suite:end', 'scenario', `${a}#2`],
                ['suite:end', 'feature', `${a}#2`],
            ])
        })

        it('uses the uid of the part as the parent of the scenario tests (scenarioLevelReporter)', () => {
            const tests = runGroupedFeatures(true).filter(({ event }) => event.startsWith('test:'))
            expect(tests.map(({ event, title, parent }) => [event, title, parent])).toEqual([
                ['test:start', 'a1', 'a.feature:3:1'],
                ['test:pass', 'a1', 'a.feature:3:1'],
                ['test:start', 'b1', 'b.feature:3:1'],
                ['test:pass', 'b1', 'b.feature:3:1'],
                ['test:start', 'a2', 'a.feature:3:1#2'],
                ['test:pass', 'a2', 'a.feature:3:1#2'],
            ])
        })
    })
})
