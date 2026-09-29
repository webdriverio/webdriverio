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
})
