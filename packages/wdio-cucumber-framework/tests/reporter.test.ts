import { EventEmitter } from 'node:events'
import { describe, expect, it, vi, afterEach, beforeEach, beforeAll } from 'vitest'
import type { TestStepFinished, TestStepStarted } from '@cucumber/messages'
import { TestStepResultStatus } from '@cucumber/messages'

import CucumberReporter from '../src/reporter.js'
import {
    gherkinDocument,
    pickle,
    testRunStarted,
    testCase,
    testCaseStarted,
    testStepStarted,
    testStepFinished,
    testCaseFinished,
    testRunFinished
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
        FAILED: 'FAILED'
    }
}))

const wdioReporter = {
    write: vi.fn(),
    emit: vi.fn(),
    on: vi.fn()
}

const buildGherkinDocEvent = () => gherkinDocument
const gherkinDocEvent = buildGherkinDocEvent()
const gherkinDocEventNoLine = buildGherkinDocEvent()
// @ts-expect-error
delete gherkinDocEventNoLine.feature?.location?.line

const loadGherkin = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { gherkinDocument })
const loadGherkinNoLine = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { gherkinDocument: gherkinDocEventNoLine })
const acceptPickle = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { pickle })
const prepareSuite = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { testCase })
const startSuite = (eventBroadcaster: EventEmitter) =>
    eventBroadcaster.emit('envelope', { testCaseStarted })

describe('cucumber reporter', () => {
    describe('emits messages for certain cucumber events', () => {
        const cid = '0-1'
        const specs = ['/foobar.js']
        let eventBroadcaster: EventEmitter
        let cucumberReporter: CucumberReporter

        beforeEach(() => {
            wdioReporter.emit.mockClear()
            eventBroadcaster = new EventEmitter()
            cucumberReporter = new CucumberReporter(
                eventBroadcaster,
                {} as any,
                { failAmbiguousDefinitions: true } as any,
                cid,
                specs,
                wdioReporter as any
            )
        })

        it('should not send any data on `gherkin-document` event', () => {
            loadGherkin(eventBroadcaster)
            expect(cucumberReporter.eventListener['_gherkinDocEvents']).toEqual([gherkinDocEvent])
            expect(wdioReporter.emit).not.toHaveBeenCalled()
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

        it('should not be ok if line is missing', () => {
            loadGherkinNoLine(eventBroadcaster)
            wdioReporter.emit.mockClear()
            acceptPickle(eventBroadcaster)

            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should send accepted pickle\'s data on `test-case-started` event', () => {
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
                const passingStep: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
                eventBroadcaster.emit('envelope', { testStepFinished: passingStep })
                delete wdioReporter.emit.mock.calls[0][1].duration
                expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
            })

            it('failed step', () => {
                const failedStep: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
                failedStep.testStepResult = {
                    ...failedStep.testStepResult,
                    status: TestStepResultStatus.FAILED
                }
                eventBroadcaster.emit('envelope', { testStepFinished: failedStep })
                delete wdioReporter.emit.mock.calls[0][1].duration
                expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
            })
        })

        it('should send proper data on onTestRunFinished', () => {
            const passingStep: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', { testStepFinished: passingStep })
            eventBroadcaster.emit('envelope', { testCaseFinished })
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('envelope', { testRunFinished })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should proper data when executing a hook', () => {
            const hookStarted: TestStepStarted = JSON.parse(JSON.stringify(testStepStarted))
            hookStarted.testStepId = '24'
            const hookFinished: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))
            hookFinished.testStepId = '24'

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted: hookStarted })
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testStepFinished: hookFinished })
            delete wdioReporter.emit.mock.calls[0][1].duration
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })
    })

    describe('emits messages for certain cucumber events when executed in scenarioLeverReporter', () => {
        const cid = '0-1'
        const specs = ['/foobar.js']
        let eventBroadcaster: EventEmitter
        let cucumberReporter: CucumberReporter

        beforeEach(() => {
            eventBroadcaster = new EventEmitter()
            cucumberReporter = new CucumberReporter(eventBroadcaster, {} as any, { failAmbiguousDefinitions: true, scenarioLevelReporter: true } as any, cid, specs, wdioReporter as any)
        })

        it('should not send any data on `gherkin-document` event', () => {
            loadGherkin(eventBroadcaster)
            expect(cucumberReporter.eventListener['_gherkinDocEvents']).toEqual([gherkinDocEvent])
            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should send proper data on `test-run-started` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            eventBroadcaster.emit('envelope', { testRunStarted })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should not send any data on `pickle-accepted` event', () => {
            loadGherkin(eventBroadcaster)
            wdioReporter.emit.mockClear()
            acceptPickle(eventBroadcaster)

            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should not be ok if line is missing', () => {
            loadGherkinNoLine(eventBroadcaster)
            wdioReporter.emit.mockClear()
            acceptPickle(eventBroadcaster)

            expect(wdioReporter.emit).not.toHaveBeenCalled()
        })

        it('should send accepted pickle\'s data on `test-case-started` event', () => {
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
            eventBroadcaster.emit('envelope', { testStepFinished: passingStep })
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('envelope', { testCaseFinished })
            delete wdioReporter.emit.mock.calls[0][1].duration
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })

        it('should send proper data on onTestRunFinished', () => {
            const passingStep: TestStepFinished = JSON.parse(JSON.stringify(testStepFinished))

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
            eventBroadcaster.emit('envelope', { testStepStarted })
            eventBroadcaster.emit('envelope', { testStepFinished: passingStep })
            eventBroadcaster.emit('envelope', { testCaseFinished })
            wdioReporter.emit.mockClear()

            eventBroadcaster.emit('envelope', { testRunFinished })
            expect(wdioReporter.emit.mock.calls).toMatchSnapshot()
        })
    })

    describe('provides a fail counter', () => {
        let eventBroadcaster: EventEmitter
        let reporter: CucumberReporter

        beforeEach(() => {
            eventBroadcaster = new EventEmitter()
            reporter = new CucumberReporter(eventBroadcaster, {} as any, { failAmbiguousDefinitions: true } as any, '0-1', ['/foobar.js'], wdioReporter as any)

            loadGherkin(eventBroadcaster)
            acceptPickle(eventBroadcaster)
            prepareSuite(eventBroadcaster)
            startSuite(eventBroadcaster)
        })

        it('should increment failed counter on `failed` status', () => {
            const failedStep: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )
            failedStep.testStepResult = {
                ...failedStep.testStepResult,
                status: TestStepResultStatus.FAILED
            }
            eventBroadcaster.emit('envelope', { testStepFinished: failedStep })
            expect(reporter.failedCount).toBe(1)
        })

        it('should increment failed counter on `ambiguous` status', () => {
            const ambiguousStep: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )
            ambiguousStep.testStepResult = {
                ...ambiguousStep.testStepResult,
                status: TestStepResultStatus.AMBIGUOUS
            }
            eventBroadcaster.emit('envelope', { testStepFinished: ambiguousStep })
            expect(reporter.failedCount).toBe(1)
        })

        it('should increment failed counter on `undefined` status', () => {
            const undefinedStep: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )
            undefinedStep.testStepResult = {
                ...undefinedStep.testStepResult,
                status: TestStepResultStatus.UNDEFINED
            }
            eventBroadcaster.emit('envelope', { testStepFinished: undefinedStep })
            expect(reporter.failedCount).toBe(1)
        })

        it('should not increment failed counter on `undefined` status if ignoreUndefinedDefinitions set to true', () => {
            reporter['_options'].ignoreUndefinedDefinitions = true
            const undefinedStep: TestStepFinished = JSON.parse(
                JSON.stringify(testStepFinished)
            )
            undefinedStep.testStepResult = {
                ...undefinedStep.testStepResult,
                status: TestStepResultStatus.UNDEFINED
            }
            eventBroadcaster.emit('envelope', { testStepFinished: undefinedStep })
            expect(reporter.failedCount).toBe(0)
        })
    })

    describe('tags in title', () => {
        let eventBroadcaster: EventEmitter

        beforeAll(() => {
            eventBroadcaster = new EventEmitter()
            new CucumberReporter(eventBroadcaster, {} as any, {
                tagsInTitle: true
            } as any, '0-1', ['/foobar.js'], wdioReporter as any)
        })

        it('should add tags on handleBeforeFeatureEvent', () => {
            eventBroadcaster.emit('envelope', { gherkinDocument: gherkinDocEvent })
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
