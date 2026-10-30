import fs from 'node:fs'
import path from 'node:path'
import type { WriteStream } from 'node:fs'
import { EventEmitter } from 'node:events'
import type { Reporters, Options } from '@wdio/types'

import { appFileName, getErrorsFromEvent, hookCountsAsFailure, sanitizeCaps, isAfterEachHook, isContextlessAllHook, knownFramework, relativeSpecFile, specFilePath, transformCommandScript, userCommandError, userOutputReplacer, isUserCommandOutput, isUserResultOutput, userCommandTitle, userCommandTitleIsCut, isNoDataResult, inlineResult, compactRequest, resolvedPath, userCommandTexts } from './utils.js'
import type { Suite } from './stats/suite.js'
import SuiteStats from './stats/suite.js'
import type { Hook } from './stats/hook.js'
import HookStats, { isSkippedHook } from './stats/hook.js'
import TestStats, { type Test, type Output, type UserCommandOutput, type UserResultOutput } from './stats/test.js'
import RunnerStats from './stats/runner.js'
import type { AfterCommandArgs, BeforeCommandArgs, CommandArgs, AfterUserCommandArgs, BeforeUserCommandArgs, ContextEnd, Tag, Argument, ReporterUnit, HookKind } from './types.js'
import { Unit } from './units.js'

type CustomWriteStream = { write: (content: unknown) => boolean }

const EXECUTE_COMMANDS = ['execute', 'executeAsync']
// the producer sends a function script as its name only
const isFunctionLabel = (value: unknown) => typeof value === 'string' && /^\[Function [^\]]*\]$/.test(value)

export default class WDIOReporter extends EventEmitter {
    outputStream: WriteStream | CustomWriteStream
    failures = 0
    suites: Record<string, SuiteStats> = {}
    hooks: Record<string, HookStats> = {}
    tests: Record<string, TestStats> ={}
    currentSuites: SuiteStats[] = []
    counts = {
        suites: 0,
        tests: 0,
        hooks: 0,
        passes: 0,
        skipping: 0,
        failures: 0,
        pending: 0
    }
    retries = 0
    runnerStat?: RunnerStats
    isContentPresent = false
    specs: string[] = []
    currentSpec?: string
    #parentOf = new WeakMap<object, SuiteStats>()
    #contextIdResolver?: () => string | undefined
    #getTestByContext: (contextId: string | undefined) => TestStats | undefined = () => undefined
    #processListeners: [string, (...args: unknown[]) => void][] = []
    // the last unit of each context stays for the life of the reporter, for late events after context:end
    #units = new Map<string, Unit>()
    // the unit with no context: a sequential run, or Cucumber failFast skip scenarios
    #seqUnit?: Unit
    #lastUnit?: Unit
    #unitOfStats = new WeakMap<object, Unit>()
    #parallelSeen = false
    // the unit of the event that the base sends to an on* hook
    #dispatch?: { unit?: Unit }
    // contextless all-hooks between hook:start and hook:end: their calls get no unit and no test
    #openAllHooks = new Set<HookStats>()
    // the open hooks of each context: they get the calls of the context before its test
    #openContextHooks = new Map<string, HookStats[]>()
    // the open hooks with hookKind of each sequential unit: a scenario gets their calls before its first step
    #openUnitHooks = new Map<Unit, HookStats[]>()
    #getCommandTarget: (payload: { contextId?: string }) => TestStats | HookStats | undefined = () => undefined
    // the owner of each open user command, from its start
    #userCommandOwners = new Map<number, TestStats | HookStats | undefined>()
    // the name of each open user command, the hidden protocol commands that wait for their result, the hidden events
    #userCommandNames = new Map<number, string>()
    #hiddenChildren = new Map<string, number>()
    #hiddenEvents = new WeakSet<object>()

    constructor(public options: Partial<Reporters.Options>) {
        super()

        // ensure the report directory exists
        if (this.options.outputDir) {
            try {
                fs.mkdirSync(this.options.outputDir, { recursive: true })
            } catch (err) {
                throw new Error(`Couldn't create output directory at "${this.options.outputDir}": ${(err as Error).stack}`)
            }
        }

        this.outputStream = (this.options.stdout || !this.options.logFile) && this.options.writeStream
            ? this.options.writeStream as CustomWriteStream
            : fs.createWriteStream(this.options.logFile!)

        let currentTest: TestStats
        const contextTests = new Map<string, TestStats>()
        // the last test of a context after its test:end, until context:end: Mocha runs afterEach / after hooks then
        const endedContextTests = new Map<string, TestStats>()
        // contexts after a suite:retry, until the next attempt starts a test: no command goes to the failed attempt
        const retriedContexts = new Set<string>()
        const retriesByContext = new Map<string, number>()
        // the count that each result added, to remove it when suite:retry clears the test
        const countedAs = new WeakMap<TestStats, 'passes' | 'skipping' | 'failures' | 'pending'>()
        const count = (testStat: TestStats, key: 'passes' | 'skipping' | 'failures' | 'pending') => {
            this.counts[key]++
            this.counts.tests++
            countedAs.set(testStat, key)
        }
        const getContextId = (test: Test) => test.contextId ?? this.tests[test.uid]?.contextId
        const getRetries = (contextId?: string) => contextId ? retriesByContext.get(contextId) ?? 0 : this.retries
        const setRetries = (contextId: string | undefined, count: number) => {
            if (contextId) {
                retriesByContext.set(contextId, count)
            } else {
                this.retries = count
            }
        }
        const applyStart = (testStat: TestStats, test: Test) => {
            if (typeof test.start === 'number' && typeof test.end === 'number') {
                testStat.start = new Date(test.start)
            }
        }
        const endOf = (test: Test) => typeof test.end === 'number' ? new Date(test.end) : undefined
        const trackContext = (test: Test, testStat: TestStats) => {
            // the stat keeps the contextId of its start when the payload has none (Cucumber scenario level)
            const contextId = test.contextId ?? testStat.contextId
            if (contextId) {
                contextTests.set(contextId, testStat)
                endedContextTests.delete(contextId)
                retriedContexts.delete(contextId)
            }
        }
        const getTestByContext = (contextId: string | undefined) => {
            if (contextId) {
                return contextTests.get(contextId) ?? endedContextTests.get(contextId)
            }
            return contextTests.size === 0 ? currentTest : undefined
        }
        this.#getTestByContext = getTestByContext
        const noRunningContext = () => contextTests.size === 0 || (retriedContexts.size > 0 && [...contextTests.keys()].every((id) => retriedContexts.has(id)))
        const getCommandTarget = (payload: { contextId?: string }): TestStats | HookStats | undefined => {
            // the innermost open contextless all-hook
            if (!payload.contextId && this.#openAllHooks.size) {
                return [...this.#openAllHooks].at(-1)
            }
            // after every context of a parallel run: the last test of the unit that opened last
            if (!payload.contextId && this.#parallelSeen && noRunningContext()) {
                return this.#lastUnit?.test ?? currentTest
            }
            // a sequential scenario before its first step: its open hook, not the step of the scenario before
            const seq = this.#seqUnit
            const seqHook = !payload.contextId && seq && !seq.ended && seq.isScenario && !seq.test ? this.#openUnitHooks.get(seq)?.at(-1) : undefined
            if (seqHook) {
                return seqHook
            }
            const test = payload.contextId && retriedContexts.has(payload.contextId) ? undefined : getTestByContext(payload.contextId)
            return test ?? (payload.contextId ? this.#openContextHooks.get(payload.contextId)?.at(-1) : undefined)
        }
        this.#getCommandTarget = getCommandTarget

        const rootSuite = new SuiteStats({
            title: '(root)',
            fullTitle: '(root)',
            file: ''
        })
        // only this suite has the mark: no event sets it
        rootSuite.isRoot = true
        this.currentSuites.push(rootSuite)

        this.on('client:beforeCommand', (payload: BeforeCommandArgs) => {
            if (!this.#hidesCommand(payload)) {
                this.#callForCommand(payload, () => this.onBeforeCommand(payload))
            }
        })
        this.on('client:afterCommand', (payload: AfterCommandArgs) => {
            if (!this.#hidesCommand(payload)) {
                this.#callForCommand(payload, () => this.onAfterCommand(payload))
            }
        })
        this.on('client:beforeUserCommand', (payload: BeforeUserCommandArgs) => {
            if (!this.showsUserCommands) {
                return
            }
            // the owner at the start: a result after the end of its test (a test timeout) stays in that test
            const owner = getCommandTarget(payload)
            this.#userCommandOwners.set(payload.id, owner)
            this.#userCommandNames.set(payload.id, payload.command)
            this.#callForCommand(payload, () => this.onBeforeUserCommand(payload))
            this.#addUserEntry(owner, payload, 'userCommand')
        })
        this.on('client:afterUserCommand', (payload: AfterUserCommandArgs) => {
            if (!this.showsUserCommands) {
                return
            }
            const known = this.#userCommandOwners.has(payload.id)
            const owner = known ? this.#userCommandOwners.get(payload.id) : getCommandTarget(payload)
            this.#userCommandOwners.delete(payload.id)
            this.#userCommandNames.delete(payload.id)
            const unit = owner && this.#unitOfStats.get(owner)
            if (unit) {
                this.#call(unit, () => this.onAfterUserCommand(payload))
            } else {
                this.#callForCommand(payload, () => this.onAfterUserCommand(payload))
            }
            this.#addUserEntry(owner, payload, 'userResult')
        })
        this.on('client:beforeAssertion', this.onBeforeAssertion.bind(this))
        this.on('client:afterAssertion', this.onAfterAssertion.bind(this))

        this.on('runner:start', (runner: Options.RunnerStart) => {
            rootSuite.cid = runner.cid
            this.specs.push(...runner.specs)
            this.runnerStat = new RunnerStats(runner)
            this.#call(undefined, () => this.onRunnerStart(this.runnerStat!))
        })

        this.on('suite:start', (params: Suite) => {
            this.#endEndedTestUnit()
            /**
             * the jasmine framework doesn't give us information about the file
             * therefore we need to propagate these information into params
             */
            if (!params.file) {
                params.file = !params.parent
                    ? this.specs.shift() || 'unknown spec file'
                    : this.currentSpec!
                this.currentSpec = params.file
            }

            const suite = new SuiteStats(params)
            const currentSuite = this.#owningSuite(params.parentUid)
            currentSuite.suites.push(suite)
            this.#parentOf.set(suite, currentSuite)
            this.currentSuites.push(suite)
            this.suites[suite.uid] = suite
            let unit: Unit | undefined
            if (suite.type === 'scenario') {
                unit = params.contextId ? this.#openContextUnit(params.contextId, suite) : this.#openUnit(undefined, suite)
                unit.stats = suite
                unit.test = undefined
                this.#unitOfStats.set(suite, unit)
            }
            this.#call(unit, () => this.onSuiteStart(suite))
        })

        /**
         * This event is currently only supported by Cucumber and is emitted instead of a new
         * 'suite:start' event when a suite is retried. This is useful for reporters that want to
         * display the number of times a suite was retried.
         */
        this.on('suite:retry', (suite: Suite) => {
            this.#endEndedTestUnit()
            const suiteStat = this.suites[suite.uid!]
            const unit = this.#unitOfStats.get(suiteStat)
            // before the counts and retry() clear the attempt that failed
            if (unit) {
                this.#call(unit, () => this.onUnitRetry(unit))
            }
            for (const testStat of suiteStat.tests) {
                const key = countedAs.get(testStat)
                if (key) {
                    this.counts[key]--
                    this.counts.tests--
                }
            }
            // suite:retry is the start of the next attempt
            if (unit) {
                unit.nextAttempt()
                unit.test = undefined
            }
            // the steps of the failed attempt get no more calls: retry() removes them; getContextTest() keeps them
            if (unit?.contextId) {
                retriedContexts.add(unit.contextId)
            }
            // onSuiteRetry sees the new retry count (as main) and the tests and hooks of the failed attempt; the start stays the first attempt's
            suiteStat.retries++
            try {
                this.#call(unit, () => this.onSuiteRetry(suiteStat))
            } finally {
                suiteStat.clearAttempt()
            }
        })

        this.on('hook:start', (hook: Hook) => {
            if (hook.contextId || !isAfterEachHook(hook)) {
                this.#endEndedTestUnit()
            }
            const hookStats = new HookStats(hook)
            const currentSuite = this.#owningSuite(hook.parentUid)
            currentSuite.hooks.push(hookStats)
            this.#parentOf.set(hookStats, currentSuite)
            currentSuite.hooksAndTests.push(hookStats)
            // a uid that starts again replaces its open entry
            this.#openAllHooks.delete(this.hooks[hook.uid!])
            if (hook.contextId) {
                const open = (this.#openContextHooks.get(hook.contextId) ?? []).filter((entry) => entry !== this.hooks[hook.uid!])
                this.#openContextHooks.set(hook.contextId, [...open, hookStats])
            }
            this.hooks[hook.uid!] = hookStats
            const allHook = isContextlessAllHook(hookStats)
            if (allHook) {
                this.#openAllHooks.add(hookStats)
            }
            const fallback = hook.contextId || allHook ? undefined : this.#fallbackUnit()
            // a contextless beforeEach before its test:start is not a hook of the ended test before it
            const unit = hook.contextId ? this.#contextUnit(hook.contextId) : fallback?.ended && hookStats.hookKind === 'beforeEach' ? undefined : fallback
            if (unit) {
                this.#unitOfStats.set(hookStats, unit)
            }
            // an ended unit reads no open hook
            if (unit && !unit.ended && !hook.contextId && hookStats.hookKind) {
                this.#openUnitHooks.set(unit, [...(this.#openUnitHooks.get(unit) ?? []).filter((entry) => entry.uid !== hookStats.uid), hookStats])
            }
            this.#call(unit, () => this.onHookStart(hookStats))
        })

        this.on('hook:end', (hook: Hook) => {
            const hookStats = this.hooks[hook.uid!]
            const openUnit = hookStats && this.#unitOfStats.get(hookStats)
            try {
                // a producer can know them only at the end of the hook
                if (hook.retried !== undefined) {
                    hookStats.retried = hook.retried
                }
                if (hook.failedTestUid !== undefined) {
                    hookStats.failedTestUid = hook.failedTestUid
                }
                if (hook.hookKind !== undefined) {
                    hookStats.hookKind = hook.hookKind
                }
                if (hook.hookSuiteUid !== undefined) {
                    hookStats.hookSuiteUid = hook.hookSuiteUid
                }
                if (hookStats && isContextlessAllHook(hookStats)) {
                    this.#unitOfStats.delete(hookStats)
                }
                hookStats.complete(getErrorsFromEvent(hook), isSkippedHook(hook))
                this.counts.hooks++
                this.#call(this.#unitOfStats.get(hookStats), () => this.onHookEnd(hookStats))
            } finally {
                this.#openAllHooks.delete(hookStats)
                // a hook:end with no hook:start: the first error stays the thrown one
                if (hookStats?.contextId) {
                    this.#openContextHooks.set(hookStats.contextId, (this.#openContextHooks.get(hookStats.contextId) ?? []).filter((entry) => entry !== hookStats))
                }
                const openHooks = openUnit && this.#openUnitHooks.get(openUnit)?.filter((entry) => entry !== hookStats)
                if (openHooks?.length) {
                    this.#openUnitHooks.set(openUnit!, openHooks)
                } else if (openUnit) {
                    this.#openUnitHooks.delete(openUnit)
                }
            }
        })

        this.on('test:start', (test: Test) => {
            this.#endEndedTestUnit()
            // an all-hook ends before a test starts: a missing hook:end
            if (!test.contextId) {
                this.#openAllHooks.clear()
            }
            test.retries = getRetries(test.contextId)
            currentTest = new TestStats(test)
            trackContext(test, currentTest)
            const currentSuite = this.#owningSuite(test.parentUid)
            currentSuite.tests.push(currentTest)
            this.#parentOf.set(currentTest, currentSuite)
            currentSuite.hooksAndTests.push(currentTest)
            this.tests[test.uid] = currentTest
            const unit = this.#unitForTestStart(currentTest, test.contextId)
            this.#call(unit, () => this.onTestStart(currentTest))
        })

        this.on('test:pass', (test: Test) => {
            const testStat = this.tests[test.uid]
            applyStart(testStat, test)
            testStat.pass(endOf(test))
            count(testStat, 'passes')
            this.#call(this.#unitOfStats.get(testStat), () => this.onTestPass(testStat))
        })

        this.on('test:skip', (test: Test) => {
            const testStat = this.tests[test.uid] ?? currentTest
            if (!testStat) {
                return
            }
            testStat.skip(test.pendingReason!)
            count(testStat, 'skipping')
            this.#call(this.#unitOfStats.get(testStat), () => this.onTestSkip(testStat))
        })

        this.on('test:fail', (test: Test) => {
            const testStat = this.tests[test.uid]

            applyStart(testStat, test)
            testStat.fail(getErrorsFromEvent(test), endOf(test))
            count(testStat, 'failures')
            this.#call(this.#unitOfStats.get(testStat), () => this.onTestFail(testStat))
        })

        this.on('test:retry', (test: Test) => {
            const testStat = this.tests[test.uid]

            applyStart(testStat, test)
            testStat.fail(getErrorsFromEvent(test), endOf(test))
            testStat.retried = true
            const unit = this.#unitOfStats.get(testStat)
            // a step of a scenario attempt is not the attempt: suite:retry is
            if (unit && !unit.isScenario) {
                this.#call(unit, () => this.onUnitRetry(unit))
                unit.retriedTest = testStat
            }
            this.#call(unit, () => this.onTestRetry(testStat))
            const contextId = getContextId(test)
            setRetries(contextId, getRetries(contextId) + 1)
        })

        this.on('test:pending', (test: Test) => {
            this.#endEndedTestUnit()
            test.retries = getRetries(getContextId(test))
            const currentSuite = this.#owningSuite(test.parentUid)
            /**
             * a test that started and did not end, and now ends as pending or skipped
             * (for example a Cucumber step that returns 'pending', or Jasmine
             * `pending()`), keeps its start, to give its duration, and its commands
             */
            const existingTest = this.tests[test.uid]
            const startedTest = existingTest?.state === 'pending' && !existingTest.end ? existingTest : undefined
            currentTest = new TestStats(test)
            if (startedTest) {
                currentTest.start = startedTest.start
                currentTest.output = startedTest.output
                // the Cucumber parallel scenario payload has no contextId
                if (currentTest.contextId === undefined && startedTest.contextId !== undefined) {
                    currentTest.contextId = startedTest.contextId
                }
                if (currentTest.parentUid === undefined && startedTest.parentUid !== undefined) {
                    currentTest.parentUid = startedTest.parentUid
                }
            }
            applyStart(currentTest, test)
            // a pending test that never started (Mocha `it.skip`) ends now, with no duration
            currentTest.complete(endOf(test))

            /**
             * In Mocha: tests that are skipped don't have a start event but a test end.
             * In Jasmine: tests have a start event, therefore we need to replace the
             * test instance with the pending test here
             */
            if (existingTest && existingTest.state !== 'pending') {
                currentTest.uid = 'skipped-' + this.counts.skipping
            }
            const testIndex = currentSuite.tests.findLastIndex((entry) => entry.uid === currentTest.uid)
            if (testIndex === -1) {
                currentSuite.tests.push(currentTest)
            } else {
                currentSuite.tests[testIndex] = currentTest
            }
            const hooksAndTestsIndex = currentSuite.hooksAndTests.findLastIndex((entry) => entry.uid === currentTest.uid)
            if (hooksAndTestsIndex === -1) {
                currentSuite.hooksAndTests.push(currentTest)
            } else {
                currentSuite.hooksAndTests[hooksAndTestsIndex] = currentTest
            }

            this.#parentOf.set(currentTest, currentSuite)
            this.tests[currentTest.uid] = currentTest
            trackContext(test, currentTest)
            const unit = this.#unitForPending(currentTest, getContextId(test), startedTest)
            if (test.state === 'pending') {
                currentTest.state = 'pending'
                count(currentTest, 'pending')
                this.#call(unit, () => this.onTestPending(currentTest))
            } else {
                currentTest.skip(test.pendingReason!)
                count(currentTest, 'skipping')
                this.#call(unit, () => this.onTestSkip(currentTest))
            }
        })

        this.on('test:end', (test: Test) => {
            const testStat = this.tests[test.uid]
            const contextId = getContextId(test)
            if (contextId) {
                const ended = contextTests.get(contextId)
                if (ended) {
                    endedContextTests.set(contextId, ended)
                }
                retriesByContext.delete(contextId)
                contextTests.delete(contextId)
            } else {
                this.retries = 0
            }
            const unit = testStat && this.#unitOfStats.get(testStat)
            this.#call(unit, () => this.onTestEnd(testStat))
            if (unit && unit.stats === testStat) {
                unit.testEnded = true
                unit.retriedTest = undefined
            }
        })

        this.on('context:end', (payload: ContextEnd) => {
            endedContextTests.delete(payload.contextId)
            this.#openContextHooks.delete(payload.contextId)
            // a test with no test:end (a failed beforeEach with failHookAffectedTests: false) stays as it is in the report
            contextTests.delete(payload.contextId)
            retriedContexts.delete(payload.contextId)
            retriesByContext.delete(payload.contextId)
            const unit = this.#units.get(payload.contextId)
            this.#call(unit, () => this.onContextEnd(payload))
            if (unit) {
                this.#endUnit(unit)
            }
        })

        this.on('suite:end', (suite: Suite) => {
            this.#endEndedTestUnit()
            const suiteStat = this.suites[suite.uid!]
            suiteStat.complete()
            const index = this.currentSuites.lastIndexOf(suiteStat)
            if (index !== -1) {
                this.currentSuites.splice(index, 1)
            }
            // a missing hook:end: in a sequential run every open all-hook, else the ones of this suite
            for (const open of this.#openAllHooks) {
                if (!this.#parallelSeen || this.hookOwner(open) === suiteStat || this.#parentOf.get(open) === suiteStat) {
                    this.#openAllHooks.delete(open)
                }
            }
            this.#call(this.#unitOfStats.get(suiteStat), () => this.onSuiteEnd(suiteStat))
            // the sequential unit ends with its scenario, or with the suite of a test that sent no test:end
            const seq = this.#seqUnit
            if (seq?.stats && (seq.stats === suiteStat || this.#parentOf.get(seq.stats) === suiteStat)) {
                this.#endUnit(seq)
            }
        })

        this.on('runner:end', (runner: Options.RunnerEnd) => {
            try {
                this.#openAllHooks.clear()
                this.#userCommandOwners.clear()
                this.#userCommandNames.clear()
                this.#hiddenChildren.clear()
                rootSuite.complete()
                for (const unit of [...this.#units.values(), ...(this.#seqUnit ? [this.#seqUnit] : [])]) {
                    this.#endUnit(unit)
                }
                if (this.runnerStat) {
                    this.runnerStat.failures = runner.failures
                    this.runnerStat.retries = runner.retries
                    this.runnerStat.error = runner.error
                    this.runnerStat.complete()
                    this.#call(undefined, () => this.onRunnerEnd(this.runnerStat!))
                }
            } finally {
                this.#removeProcessListeners()
            }
            const logFile = (this.options as Reporters.Options).logFile
            if (!this.isContentPresent && logFile && fs.existsSync(logFile)) {
                fs.unlinkSync(logFile)
            }
        })

        /**
         * browser client event handlers
         */
        this.on('client:beforeCommand', (payload) => {
            const target = getCommandTarget(payload)
            if (!target || this.#hidesCommand(payload)) {
                return
            }
            if (payload.body?.script) {
                payload.body = {
                    ...payload.body,
                    script: transformCommandScript(payload.body.script)
                }
            }
            (target.output ??= []).push(Object.assign(payload, { type: 'command' }))
        })
        this.on('client:afterCommand', (payload) => {
            const target = getCommandTarget(payload)
            if (!target || this.#hidesCommand(payload)) {
                return
            }
            if (payload.body?.script) {
                payload.body = {
                    ...payload.body,
                    script: transformCommandScript(payload.body.script)
                }
            }
            (target.output ??= []).push(Object.assign(payload, { type: 'result' }))
        })
    }

    // a copy: the runner sends the same payload to every reporter
    #addUserEntry(owner: TestStats | HookStats | undefined, payload: BeforeUserCommandArgs | AfterUserCommandArgs, type: 'userCommand' | 'userResult') {
        if (!owner) {
            return
        }
        const body = EXECUTE_COMMANDS.includes(payload.command) && Array.isArray(payload.body) && payload.body.length > 0 && !isFunctionLabel(payload.body[0])
            ? [transformCommandScript(payload.body[0] as string), ...payload.body.slice(1)]
            : payload.body
        const entry: UserCommandOutput | UserResultOutput = type === 'userCommand'
            ? { ...payload, body, type }
            : { ...payload as AfterUserCommandArgs, body, type }
        // user entries are not protocol entries: reporters narrow them with the guards
        ;(owner.output ??= []).push(entry as unknown as Output)
    }

    /**
     * `true` when the reporter overrides `onBeforeUserCommand` or `onAfterUserCommand`: it then gets the user
     * commands, and the protocol commands that a user command runs get its id as `parent` (see `hidesProtocolCommands`).
     * @experimental the name and the rule may change
     */
    protected get showsUserCommands(): boolean {
        return this.onBeforeUserCommand !== WDIOReporter.prototype.onBeforeUserCommand
            || this.onAfterUserCommand !== WDIOReporter.prototype.onAfterUserCommand
    }

    /**
     * `true` hides the protocol commands that a user command runs from a reporter that shows user commands. By
     * default they are kept, with their `parent`, so the reporter can show them as children of the user command.
     * @experimental the name and the rule may change
     */
    protected get hidesProtocolCommands(): boolean {
        return false
    }

    // a screenshot event has no parent: reporters take screenshots from it
    #hidesCommand(payload: CommandArgs) {
        if (payload.parent === undefined || !this.showsUserCommands) {
            return false
        }
        if (this.hidesProtocolCommands || this.#hiddenEvents.has(payload)) {
            return true
        }
        // the old events of a custom command have no method, so a protocol result never takes their place
        const key = `${payload.parent}:${payload.command}:${payload.method ?? ''}`
        let hidden: boolean
        if ('result' in payload) {
            // the result of a hidden command, also when it comes after the result of the user command
            const open = this.#hiddenChildren.get(key) ?? 0
            hidden = open > 0
            if (open > 1) {
                this.#hiddenChildren.set(key, open - 1)
            } else {
                this.#hiddenChildren.delete(key)
            }
        } else {
            const name = this.#userCommandNames.get(payload.parent)
            // a user command with no entry (excluded, or sent to no listener), or the old event of a custom command
            hidden = name === undefined || (!payload.method && name === payload.command)
            if (hidden) {
                this.#hiddenChildren.set(key, (this.#hiddenChildren.get(key) ?? 0) + 1)
            }
        }
        if (hidden) {
            this.#hiddenEvents.add(payload)
        }
        return hidden
    }

    /**
     * Sets how the runner identifies the parallel-mode context of the calling code.
     * Set by the runner; reporters do not need to call it.
     */
    setContextIdResolver(resolver: () => string | undefined) {
        this.#contextIdResolver = resolver
    }

    /**
     * Returns the test running in the caller's parallel-mode context. Without a resolver,
     * returns the current test unless parallel tests are tracked.
     */
    getContextTest(): TestStats | undefined {
        return this.#getTestByContext(this.#contextIdResolver?.())
    }

    /**
     * The stats that the commands of the caller go to: the test of its parallel-mode context, else the open hook of
     * that context (before its test, also after a `suite:retry` until the next attempt starts a step), else the open
     * `beforeAll` / `afterAll` with `hookKind` and no context, else in a sequential Cucumber scenario before its first
     * step the open hook with `hookKind` of that scenario. With no
     * context in a parallel run and no parallel test running: the last test of the unit that opened last, not the
     * test that started last; else as `getContextTest`.
     * Use it to give a log of the caller to its owner.
     * @experimental the name and the result may change
     */
    getContextOwner(): TestStats | HookStats | undefined {
        return this.#getCommandTarget({ contextId: this.#contextIdResolver?.() })
    }

    /** Context id of the caller's parallel test, also in hooks that run before `test:start`. Undefined without parallel mode. */
    getContextId(): string | undefined {
        return this.#contextIdResolver?.()
    }

    /**
     * Listens on `process` until this reporter's runner ends. One process can create a reporter
     * per job, e.g. the Vitest framework in the launcher, so listeners that outlive their runner
     * would pile up and keep every finished reporter in memory.
     */
    protected onProcess<Args extends unknown[]>(event: string, handler: (...args: Args) => void) {
        const listener = handler as (...args: unknown[]) => void
        process.on(event, listener)
        this.#processListeners.push([event, listener])
    }

    #removeProcessListeners() {
        this.#processListeners.forEach(([event, handler]) => process.off(event, handler))
        this.#processListeners = []
    }

    /**
     * The unit of the caller: in an `on*` hook the unit of the event, else the unit of the caller's parallel-mode
     * context, else the sequential unit (also after its end). With `contextId`: the last unit of that context, for the
     * life of the reporter (also after `runner:end`). After the first parallel context, code outside every context gets `undefined`. Runner and suite
     * events (except a Cucumber scenario) and a `beforeAll` / `afterAll` with `hookKind` and no context have no unit.
     * @experimental the name and the result may change
     */
    getContextUnit(contextId?: string): ReporterUnit | undefined {
        if (contextId) {
            return this.#units.get(contextId)
        }
        if (this.#dispatch) {
            return this.#dispatch.unit
        }
        const id = this.#contextIdResolver?.()
        if (id) {
            return this.#units.get(id)
        }
        return this.#openAllHooks.size ? undefined : this.#fallbackUnit()
    }

    /**
     * The owner of a hook: its unit, or for a `beforeAll` / `afterAll` with `hookKind` and no context its suite
     * (`hookSuiteUid`, else `parentOf`). Such a hook of the root suite gets `undefined`, as a hook with no unit.
     * @experimental
     */
    hookOwner(hook: HookStats): ReporterUnit | SuiteStats | undefined {
        if (isContextlessAllHook(hook)) {
            return (hook.hookSuiteUid && this.suites[hook.hookSuiteUid]) || this.parentOf(hook)
        }
        return this.#unitOfStats.get(hook)
    }

    /** A hook of a Cucumber feature (`BeforeAll` / `AfterAll`): its suite is a `feature`. @experimental */
    isFeatureHook(hook: HookStats): boolean {
        return this.parentOf(hook)?.type === 'feature'
    }

    /** The unit that these stats belong to. @experimental */
    unitOf(stats: SuiteStats | HookStats | TestStats): ReporterUnit | undefined {
        return this.#unitOfStats.get(stats)
    }

    /**
     * State of the reporter for one unit, made by `init` at the first call; `undefined` with no unit (see `getContextUnit`).
     * `target` is a context id, or the unit itself (from `unitOf` or `getContextUnit`): after an `await` in an `on*` method,
     * pass the unit that you kept before the `await`.
     * @experimental
     */
    unitState<T>(key: unknown, init: (unit: ReporterUnit) => T, target?: string | ReporterUnit): T | undefined {
        return this.#stateOf('state', key, init, target)
    }

    /** As `unitState`, but new for each attempt of the unit. @experimental */
    attemptState<T>(key: unknown, init: (unit: ReporterUnit) => T, target?: string | ReporterUnit): T | undefined {
        return this.#stateOf('attemptState', key, init, target)
    }

    #stateOf<T>(kind: 'state' | 'attemptState', key: unknown, init: (unit: ReporterUnit) => T, target?: string | ReporterUnit): T | undefined {
        const unit = (typeof target === 'object' ? target : this.getContextUnit(target)) as Unit | undefined
        if (!unit) {
            return undefined
        }
        const map = unit[kind] ??= new Map()
        if (!map.has(key)) {
            map.set(key, init(unit))
        }
        return map.get(key) as T
    }

    #call(unit: Unit | undefined, hook: () => void) {
        const previous = this.#dispatch
        this.#dispatch = { unit }
        try {
            hook()
        } finally {
            this.#dispatch = previous
        }
    }

    // a command with no contextId keeps the resolver and the fallback
    #callForCommand(payload: { contextId?: string }, hook: () => void) {
        const unit = payload.contextId ? this.#units.get(payload.contextId) : undefined
        return unit ? this.#call(unit, hook) : hook()
    }

    // a new sequential unit ends the one before it
    #openUnit(contextId?: string, stats?: SuiteStats | TestStats): Unit {
        const unit = new Unit(contextId)
        unit.stats = stats
        unit.test = stats instanceof SuiteStats ? undefined : stats
        if (contextId) {
            this.#units.set(contextId, unit)
            this.#parallelSeen = true
        } else {
            if (this.#seqUnit) {
                this.#endUnit(this.#seqUnit)
            }
            this.#seqUnit = unit
        }
        if (stats) {
            this.#unitOfStats.set(stats, unit)
        }
        this.#lastUnit = unit
        this.#call(unit, () => this.onUnitStart(unit))
        return unit
    }

    // a hook after context:end keeps the ended unit
    #contextUnit(contextId: string): Unit {
        return this.#units.get(contextId) ?? this.#openUnit(contextId)
    }

    // a test or scenario in a context that ended is a new unit (Vitest bail reports each test again)
    #openContextUnit(contextId: string, stats: SuiteStats | TestStats): Unit {
        const known = this.#units.get(contextId)
        return known && !known.ended ? known : this.#openUnit(contextId, stats)
    }

    // after the first parallel context, only an open sequential unit (Cucumber failFast skip scenarios)
    #fallbackUnit(): Unit | undefined {
        const unit = this.#seqUnit
        return !this.#parallelSeen || (unit && !unit.ended) ? unit : undefined
    }

    #endUnit(unit: Unit) {
        if (unit.ended) {
            return
        }
        unit.ended = true
        this.#openUnitHooks.delete(unit)
        // an ended unit has no next attempt
        unit.retriedTest = undefined
        this.#call(unit, () => this.onUnitEnd(unit))
    }

    // a sequential test unit stays open after its test:end for the afterEach hooks of the test
    #endEndedTestUnit() {
        const seq = this.#seqUnit
        if (seq?.testEnded) {
            this.#endUnit(seq)
        }
    }

    #unitForTestStart(stat: TestStats, contextId: string | undefined): Unit {
        const seq = this.#seqUnit
        const unit = contextId
            ? this.#openContextUnit(contextId, stat)
            : seq && seq.takesTest(stat) ? seq : this.#openUnit(undefined, stat)
        if (!unit.isScenario) {
            if (unit.retriedTest) {
                unit.nextAttempt()
            }
            unit.stats = stat
            unit.testEnded = false
        }
        unit.test = stat
        this.#unitOfStats.set(stat, unit)
        return unit
    }

    // a test:pending replaces a started test, or is a test of its own (Mocha `it.skip`)
    #unitForPending(stat: TestStats, contextId: string | undefined, replaced?: TestStats): Unit {
        const seq = this.#seqUnit
        const unit = contextId
            ? this.#openContextUnit(contextId, stat)
            : seq && ((replaced && this.#unitOfStats.get(replaced) === seq) || (seq.isScenario && seq.takesTest(stat)))
                ? seq
                : this.#openUnit(undefined, stat)
        if (!unit.stats || (replaced && unit.stats === replaced)) {
            unit.stats = stat
        }
        unit.test = stat
        this.#unitOfStats.set(stat, unit)
        return unit
    }

    /** The suite of these stats as the base inserted them, `undefined` under the root suite. @experimental */
    parentOf(stats: SuiteStats | HookStats | TestStats): SuiteStats | undefined {
        const parent = this.#parentOf.get(stats)
        return parent === this.currentSuites[0] ? undefined : parent
    }

    /** The suites above these stats, outermost first, without the root suite. @experimental */
    pathOf(stats: SuiteStats | HookStats | TestStats): SuiteStats[] {
        const path: SuiteStats[] = []
        for (let suite = this.parentOf(stats); suite; suite = this.parentOf(suite)) {
            path.unshift(suite)
        }
        return path
    }

    /** The number of suites above these stats, without the root suite. @experimental */
    depthOf(stats: SuiteStats | HookStats | TestStats): number {
        return this.pathOf(stats).length
    }

    #owningSuite(parentUid?: string | null) {
        if (parentUid === null) {
            return this.currentSuites[0]
        }
        return (parentUid && this.suites[parentUid]) || this.currentSuites[this.currentSuites.length - 1]
    }

    /**
     * allows reporter to stale process shutdown process until required sync work
     * is done (e.g. when having to send data to some server or any other async work)
     */
    get isSynchronised() {
        return true
    }

    /**
     * function to write to reporters output stream
     */
    write(content: unknown) {
        if (content) {
            this.isContentPresent = true
        }
        this.outputStream.write(content)
    }
    onRunnerStart(_runnerStats: RunnerStats) { }
    onBeforeCommand(_commandArgs: BeforeCommandArgs) { }
    onAfterCommand(_commandArgs: AfterCommandArgs) { }
    /**
     * A user command starts: a command that the test code calls directly (a WebdriverIO command or a custom
     * command). WebDriver BiDi sessions only. Override it or `onAfterUserCommand` to get user commands.
     * @experimental the name and the payload may change
     */
    onBeforeUserCommand(_payload: BeforeUserCommandArgs) { }
    /**
     * A user command ends, with its `result`: `{ value }` or `{ error }`. WebDriver BiDi sessions only.
     * @experimental the name and the payload may change
     */
    onAfterUserCommand(_payload: AfterUserCommandArgs) { }
    onBeforeAssertion(_assertionArgs: unknown) { }
    onAfterAssertion(_assertionArgs: unknown) { }
    onSuiteStart(_suiteStats: SuiteStats) { }
    onHookStart(_hookStat: HookStats) { }
    onHookEnd(_hookStats: HookStats) { }
    onTestStart(_testStats: TestStats) { }
    onTestPass(_testStats: TestStats) { }
    onTestFail(_testStats: TestStats) { }
    onTestRetry(_testStats: TestStats) { }
    onTestSkip(_testStats: TestStats) { }
    onTestPending(_testStats: TestStats) { }
    onTestEnd(_testStats: TestStats) { }
    /**
     * Called when the browsing context of a parallel test sends no more events, after the
     * `afterEach` and `after` hooks of its test
     * @experimental sent only in Mocha `parallelMode` for now; the name and the payload may change
     */
    onContextEnd(_payload: ContextEnd) { }
    /** A suite runs again (Cucumber): it has its new `retries` and the tests and hooks of the failed attempt; the base clears them after it. */
    onSuiteRetry(_suiteStats: SuiteStats) { }
    /** A unit starts: at the first event of a parallel context (a `test:start`, a `test:pending` or a scenario `suite:start` in an ended context starts a new one), or at a sequential test or scenario. @experimental */
    onUnitStart(_unit: ReporterUnit) { }
    /** An attempt of a unit failed and runs again (`test:retry`, `suite:retry`), before the base clears its stats. @experimental */
    onUnitRetry(_unit: ReporterUnit) { }
    /** A unit ends: at `context:end`; in a sequential run after the `afterEach` hooks of its test (at the next hook, test or suite event) or at the scenario `suite:end`, else the next unit, its suite end, `runner:end`. @experimental */
    onUnitEnd(_unit: ReporterUnit) { }
    onSuiteEnd(_suiteStats: SuiteStats) { }
    onRunnerEnd(_runnerStats: RunnerStats) { }
}

/**
 * Returns the browser name from the capabilities
 * @param caps WebdriverIO Capabilities
 * @returns {string} Browser name
 */
function getBrowserName(caps: WebdriverIO.Capabilities) {
    // @ts-expect-error legacy capability names
    const app = ((caps['appium:app'] || caps.app) || '').replace('sauce-storage:', '')
    const appName = (
        caps['appium:bundleId'] ||
        caps['appium:appPackage'] ||
        caps['appium:appActivity'] ||
        (path.isAbsolute(app) ? path.basename(app) : appFileName(app))
    )
    // @ts-expect-error legacy capability names
    return caps.browserName || caps.browser || appName
}

/**
 * @experimental the capabilities of each session of a runner, in the order of the multi-remote instances, with the
 * name of the instance (none for a run with one session). `alwaysMatch` is unwrapped; a multi-remote instance with no capabilities
 * keeps its name with empty capabilities, and a single session that is not an object is left out
 * @param capabilities the `capabilities` of a runner: of one session, or a map of the multi-remote instances
 * @param isMultiRemote `runner.isMultiRemote`
 */
function getSessions(capabilities: unknown, isMultiRemote = false): { name?: string, capabilities: Record<string, unknown> }[] {
    type Session = { alwaysMatch?: Record<string, unknown>, capabilities?: unknown } | null | undefined
    const sessions: [string | undefined, Session][] = isMultiRemote && capabilities && typeof capabilities === 'object'
        // a session that did not start has the requested capabilities: `{ capabilities: { ... } }`
        ? Object.entries(capabilities as Record<string, Session>).map(([name, instance]) => [name, (instance?.capabilities ?? instance) as Session])
        : [[undefined, capabilities as Session]]
    return sessions.flatMap(([name, session]) => {
        if (session && typeof session === 'object') {
            return [{ ...(name !== undefined && { name }), capabilities: (session.alwaysMatch ?? session) as Record<string, unknown> }]
        }
        // an instance with no capabilities still has a name
        return name !== undefined ? [{ name, capabilities: {} }] : []
    })
}

function sessionCapabilities(capabilities: unknown, isMultiRemote: boolean): Record<string, unknown>[] {
    return getSessions(capabilities, isMultiRemote).map((session) => session.capabilities)
}

/**
 * @experimental the name of the browser of each session of a runner, in the order of the multi-remote
 * instances: `getBrowserName`, else the Appium device name. A session with neither has no entry
 * @param capabilities the `capabilities` of a runner: of one session, or a map of the multi-remote instances
 * @param isMultiRemote `runner.isMultiRemote`
 */
function getBrowserNames(capabilities: unknown, isMultiRemote = false): string[] {
    return sessionCapabilities(capabilities, isMultiRemote).flatMap((caps) => {
        const name = getBrowserName(caps as WebdriverIO.Capabilities) || caps['appium:deviceName'] || caps.deviceName
        return typeof name === 'string' && name ? [name] : []
    })
}

/**
 * @experimental the label of each session of a runner, in the order of the multi-remote instances:
 * the `getBrowserName` result (the browser or the app), then ` on <device> (<platform> <version>)`
 * when the session has a device. A session with a device only has `<device> (<platform> <version>)`.
 * A session with neither a name nor a device has no entry
 * @param capabilities the `capabilities` of a runner: of one session, or a map of the multi-remote instances
 * @param isMultiRemote `runner.isMultiRemote`
 */
function getSessionNames(capabilities: unknown, isMultiRemote = false): string[] {
    return sessionCapabilities(capabilities, isMultiRemote).flatMap((caps) => {
        const text = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? String(value) : ''
        const name = text(getBrowserName(caps as WebdriverIO.Capabilities))
        const device = text(caps['appium:deviceName'] || caps.deviceName)
        if (!device) {
            return name ? [name] : []
        }
        const platform = [text(caps.platformName), text(caps['appium:platformVersion'] || caps.platformVersion)].filter(Boolean).join(' ')
        const label = `${device}${platform ? ` (${platform})` : ''}`
        return [name ? `${name} on ${label}` : label]
    })
}

export {
    SuiteStats, Tag, HookStats, TestStats, RunnerStats, BeforeCommandArgs,
    AfterCommandArgs, CommandArgs, BeforeUserCommandArgs, AfterUserCommandArgs, ContextEnd, Argument, Test, getBrowserName, getBrowserNames, getSessionNames, getSessions, sanitizeCaps, knownFramework, relativeSpecFile, specFilePath, hookCountsAsFailure, isContextlessAllHook, userCommandError, userOutputReplacer, isUserCommandOutput, isUserResultOutput, userCommandTitle, userCommandTitleIsCut, isNoDataResult, inlineResult, compactRequest, resolvedPath, userCommandTexts, ReporterUnit, HookKind
}
export type { Output, UserCommandOutput, UserResultOutput } from './stats/test.js'
