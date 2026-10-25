/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'node:path'
import url from 'node:url'
import os from 'node:os'

import type { RunnerStats, TestStats } from '@wdio/reporter'
import WDIOReporter, { HookStats, SuiteStats, hookCountsAsFailure } from '@wdio/reporter'
import junitReportBuilder, { type Builder as JUnitReportBuilder } from 'junit-report-builder'

import type { JUnitReporterOptions } from './types.js'
import { limit } from './utils.js'
import { events } from './common/api.js'

const ansiRegex = new RegExp([
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
].join('|'), 'g')

/** Interface to store additional information for a given testcase */
interface JunitReporterAdditionalInformation {
    /** uid of the test case */
    uid: string
    /** Worker console log for this test. only filled if addWorkerLogs is true */
    workerConsoleLog: string
    /** Additional properties for junit reporting */
    properties: { [keys: string]: string }
    /** hooks of the parallel context of the test before it started */
    hooks?: HookStats[]
}

// as the base: a `beforeAll` / `afterAll` with no context belongs to its suite
const isContextlessAllHook = (hook: HookStats) => !hook.contextId && (hook.hookKind === 'beforeAll' || hook.hookKind === 'afterAll')
// the hooks of a unit before its test
const HOOKS_BEFORE_TEST = Symbol('junit hooks before test')

/**
 * Reporter that converts test results from a single instance/runner into an XML JUnit report. This class
 * uses junit-report-builder (https://github.com/davidparsson/junit-report-builder) to build report.The report
 * generated from this reporter should conform to the standard JUnit report schema
 * (https://github.com/junit-team/junit5/blob/master/platform-tests/src/test/resources/jenkins-junit.xsd).
 */
class JunitReporter extends WDIOReporter {
    private _suiteNameRegEx: RegExp
    private _packageName?: string
    private _suiteTitleLabel?: string
    private _fileNameLabel?: string
    private _activeFeature?: any
    private _activeFeatureName?: any
    private _testToAdditionalInformation: { [keys: string]: JunitReporterAdditionalInformation }
    private _originalStdoutWrite: Function
    private _addWorkerLogs: boolean
    private _isWindows: boolean
    // worker logs and properties of a hook: the base gives it the calls with no test (K28, K29)
    private _hookInformation = new Map<HookStats, JunitReporterAdditionalInformation>()
    private _suiteNodes: { node: any, suite: SuiteStats }[] = []
    // failed hooks written as testcases: their output is not in the testsuite
    private _hookTestCases = new Map<object, HookStats>()
    private _afterScenarioHooks = new Set<HookStats>()
    private _lateTestCases: (() => void)[] = []
    // hooks whose output a test took (K29): their testcase does not write it again
    private _takenHooks = new Set<HookStats>()

    constructor(public options: JUnitReporterOptions) {
        super(options)
        this._isWindows = os.platform() === 'win32'
        this._addWorkerLogs = options.addWorkerLogs ?? false
        this._testToAdditionalInformation = {}
        this._originalStdoutWrite = process.stdout.write.bind(process.stdout)
        this._suiteNameRegEx = this.options.suiteNameFormat instanceof RegExp
            ? this.options.suiteNameFormat
            : /[^a-zA-Z0-9@]+/ // Reason for ignoring @ is; reporters like wdio-report-portal will fetch the tags from testcase name given as @foo @bar

        const processObj: any = process
        if (this._addWorkerLogs) {
            processObj.stdout.write = this._appendConsoleLog.bind(this)
        }
        const addProperty = this._addPropertyToCurrentTest.bind(this)
        this.onProcess(events.addProperty, addProperty)
        this.on(events.addProperty, addProperty)
    }

    onTestRetry(testStats: TestStats) {
        testStats.skip('Retry')
    }

    onTestStart(test: TestStats) {
        this._testToAdditionalInformation[test.uid] = {
            workerConsoleLog: '',
            properties: {},
            uid: test.uid,
            ...this._hooksBeforeTest()
        }
    }

    onTestPending(test: TestStats) {
        const hooks = this._hooksBeforeTest()
        if (hooks && !this._testToAdditionalInformation[test.uid]) {
            this._testToAdditionalInformation[test.uid] = { workerConsoleLog: '', properties: {}, uid: test.uid, ...hooks }
        }
    }

    onHookStart(hook: HookStats) {
        const unit = this.getContextUnit()
        // a parallel unit, or a sequential scenario before its first step (U4)
        if (unit && !unit.test) {
            this.unitState(HOOKS_BEFORE_TEST, () => [] as HookStats[])!.push(hook)
        }
        const parent = this.parentOf(hook)
        if (parent?.type === 'feature' && (parent.suites.length || parent.tests.length)) {
            this._afterScenarioHooks.add(hook)
        }
    }

    onRunnerEnd(runner: RunnerStats) {
        const xml = this._buildJunitXml(runner)
        this.write(xml)
    }

    // the hooks of the unit that ran before its test (K29)
    private _hooksBeforeTest() {
        const hooks = this.unitState(HOOKS_BEFORE_TEST, () => [] as HookStats[])?.splice(0)
        hooks?.forEach((hook) => this._takenHooks.add(hook))
        return hooks?.length ? { hooks } : undefined
    }

    // the owner of a worker log or a property: the stats that the base gives the calls of the caller
    private _currentInformation(): JunitReporterAdditionalInformation | undefined {
        const owner = this.getContextOwner()
        if (!(owner instanceof HookStats)) {
            return owner ? this._testToAdditionalInformation[owner.uid] : undefined
        }
        if (!this._hookInformation.has(owner)) {
            this._hookInformation.set(owner, { uid: owner.uid, workerConsoleLog: '', properties: {} })
        }
        return this._hookInformation.get(owner)
    }

    private _addPropertyToCurrentTest(dataObj: { name: string, value: string }) {
        const info = this._currentInformation()
        if (info) {
            info.properties[dataObj.name] = dataObj.value
        }
    }

    private _appendConsoleLog(chunk: string, encoding: BufferEncoding, callback: ((err?: Error) => void)) {
        const info = this._currentInformation()
        if (info && typeof chunk === 'string' && !chunk.includes('mwebdriver')) {
            info.workerConsoleLog = (info.workerConsoleLog ?? '') + chunk
        }
        return this._originalStdoutWrite(chunk, encoding, callback)
    }

    private _prepareName(name = 'Skipped test') {
        return name.split(this._suiteNameRegEx).filter(
            (item) => item && item.length
        ).join(' ')
    }

    private _addFailedHooks(suite: SuiteStats) {
        /**
         * Add failed hooks to suite as tests.
         */
        const failedHooks = suite.hooks.filter(hook => hookCountsAsFailure(hook) && hook.title.match(/^"(before|after)( all| each)?" hook/))
        failedHooks.forEach(hook => {
            suite.tests.push(this._hookTestCase(hook))
        })
        return suite
    }

    // a failed hook as a test: it keeps the output that the base gave the hook
    private _hookTestCase(hook: HookStats) {
        const { title, _duration, error, state } = hook
        const test = {
            _duration,
            title,
            error,
            state: state as 'failed' | 'passed',
            output: this._takenHooks.has(hook) ? [] : hook.output ?? []
        } as unknown as TestStats
        this._hookTestCases.set(test, hook)
        return test
    }

    /**
     * Add the failed hooks of a Cucumber scenario to its steps. Cucumber hooks have no
     * Mocha style title (an unnamed `Before` has none at all), so take every failed hook.
     * Hooks that ran before the first step go in front of the steps, so the scenario is
     * reported as failed and not as skipped.
     */
    private _addFailedCucumberHooks(scenario: SuiteStats) {
        const firstStep = scenario.tests[0]
        const order = scenario.hooksAndTests ?? []
        const indexOf = (entry: HookStats | TestStats) => order.findIndex((recorded) => recorded === entry || recorded.uid === entry.uid)
        const firstStepIndex = firstStep ? indexOf(firstStep) : -1
        const isBefore = (hook: HookStats) => {
            if (!firstStep) {
                return true
            }
            /**
             * the reporter records hooks and steps in the order they ran, a start time
             * can be the same for a step and the hook right after it
             */
            const hookIndex = indexOf(hook)
            if (hookIndex !== -1 && firstStepIndex !== -1) {
                return hookIndex < firstStepIndex
            }
            return new Date(hook.start).getTime() < new Date(firstStep.start).getTime()
        }
        const toStep = (hook: HookStats, before: boolean) => ({
            _duration: hook._duration,
            title: hook.title || (before ? 'Before hook' : 'After hook'),
            error: hook.error,
            state: 'failed',
            output: []
        }) as unknown as TestStats

        const failedHooks = scenario.hooks.filter(hookCountsAsFailure)
        scenario.tests.unshift(...failedHooks.filter(isBefore).map((hook) => toStep(hook, true)))
        scenario.tests.push(...failedHooks.filter((hook) => !isBefore(hook)).map((hook) => toStep(hook, false)))
        return scenario
    }

    /**
     * Build a single <testcase> element from a TestStats entry. Shared between plain
     * Mocha/Jasmine suites (`_addSuiteToBuilder`) and Cucumber feature suites whose
     * scenarios are reported directly as tests (`cucumberOpts.scenarioLevelReporter`).
     */
    private _buildTestCase(testSuiteBuilder: any, test: TestStats, filePath: string, classNameFormat: string) {
        const testName = this._prepareName(test.title)
        const testCase = testSuiteBuilder.testCase()
            .className(classNameFormat)
            .name(testName)
            .time(test._duration / 1000)

        if (this.options.addFileAttribute) {
            testCase.file(filePath)
        }

        if (test.state === 'pending' || test.state === 'skipped') {
            testCase.skipped()
            if (test.error) {
                testCase.standardError(`\n${test.error.stack?.replace(ansiRegex, '') ?? ''}\n`)
            }
        } else if (test.state === 'failed') {
            if (test.error) {
                if (test.error.message) {
                    test.error.message = test.error.message.replace(ansiRegex, '')
                }

                if (this.options.errorOptions) {
                    const errorOptions = this.options.errorOptions
                    for (const key of Object.keys(errorOptions)) {
                        testCase[key]((test.error as any)[errorOptions[key]])
                    }
                } else {
                    // default
                    testCase.failure(test.error.message)
                }
                // a test can fail with more errors, e.g. its body and the afterEach that Vitest gives it
                const stacks = (test.errors?.length ? test.errors : [test.error]).map((error) => error.stack?.replace(ansiRegex, '') ?? '')
                testCase.standardError(`\n${stacks.join('\n')}\n`)
            } else {
                testCase.failure()
            }
        }

        for (const [propName, value] of this._propertiesOf(test)) {
            testCase.property(propName, value)
        }

        const output = this._getStandardOutput(test)
        if (output) {
            testCase.standardOutput(`\n${output}\n`)
        }
    }

    private _addCucumberFeatureToBuilder(builder: any, runner: RunnerStats, specFileName: string, suite: SuiteStats) {
        const featureName = !this.options.suiteNameFormat || this.options.suiteNameFormat instanceof RegExp
            ? this._prepareName(suite.title)
            : this.options.suiteNameFormat({ name: this.options.suiteNameFormat.name, suite })

        const filePath = specFileName.replace(process.cwd(), '.')

        if (suite.type === 'feature') {
            const feature = builder.testSuite()
                .name(featureName)
                .timestamp(suite.start)
                .time(suite._duration / 1000)
                .property('specId', 0)
                .property(this._suiteTitleLabel, suite.title)
                .property('capabilities', runner.sanitizedCapabilities)
                .property(this._fileNameLabel, filePath)
            this._activeFeature = feature
            this._activeFeatureName = featureName
            this._suiteNodes.push({ node: feature, suite })

            const classNameFormat = this.options.classNameFormat
                ? this.options.classNameFormat({ packageName: this._packageName, activeFeatureName: featureName })
                : `${this._packageName}.${featureName}`
            /**
             * When `cucumberOpts.scenarioLevelReporter` is enabled, whole scenarios are
             * reported as tests directly on the feature suite (no separate `scenario`
             * suite is ever emitted), so we need to add them as test cases here.
             */
            for (const testKey of Object.keys(suite.tests)) {
                if (testKey === 'undefined') {
                    continue
                }

                const test = suite.tests[testKey as any]
                this._buildTestCase(feature, test, filePath, classNameFormat)
            }

            // a failed hook of the feature: a Cucumber BeforeAll / AfterAll (K26), an AfterAll after the scenarios
            for (const hook of suite.hooks.filter(hookCountsAsFailure)) {
                const add = () => this._buildTestCase(feature, this._hookTestCase(hook), filePath, classNameFormat)
                if (hook.hookKind === 'afterAll' || (!hook.hookKind && this._afterScenarioHooks.has(hook))) {
                    this._lateTestCases.push(add)
                } else {
                    add()
                }
            }
        } else if (this._activeFeature) {
            let scenario = suite
            const testName = this._prepareName(suite.title)
            const classNameFormat = this.options.classNameFormat ? this.options.classNameFormat({ packageName: this._packageName, activeFeatureName: this._activeFeatureName }) : `${this._packageName}.${this._activeFeatureName}`
            const testCase = this._activeFeature.testCase()
                .className(classNameFormat)
                .name(`${testName}`)
                .time(scenario._duration / 1000)

            if (this.options.addFileAttribute) {
                testCase.file(filePath)
            }

            scenario = this._addFailedCucumberHooks(scenario)

            let stepsOutput = ''
            let isFailing = false
            for (const stepKey of Object.keys(scenario.tests)) { // tests are trested as steps in Cucumber
                if (stepKey === 'undefined') { // fix cucumber hooks crashing reporter
                    continue
                }

                let stepEmoji = '✅'
                const step = scenario.tests[stepKey as any]
                if (step.state === 'pending' || step.state === 'skipped') {
                    if (!isFailing) {
                        testCase.skipped()
                    }
                    stepEmoji = '⚠️'
                } else if (step.state === 'failed') {
                    if (step.error) {
                        if (step.error.message) {
                            step.error.message = step.error.message.replace(ansiRegex, '')
                        }

                        if (this.options.errorOptions) {
                            const errorOptions = this.options.errorOptions
                            for (const key of Object.keys(errorOptions)) {
                                testCase[key](step.error
                                    ? (step.error as any)[errorOptions[key]]
                                    : null
                                )
                            }
                        } else {
                            // default
                            testCase.failure(step.error.message)
                        }
                        testCase.standardError(`\n${step.error.stack?.replace(ansiRegex, '') ?? ''}\n`)
                    } else {
                        testCase.failure()
                    }
                    isFailing = true
                    stepEmoji = '❗'
                }
                const output = this._getStandardOutput(step)
                stepsOutput += stepEmoji + ' ' + step.title + '\n' + (output ? output + '\n' : '')
            }

            // Add properties for each step (Cucumber steps are tests in the scenario)
            for (const stepKey of Object.keys(scenario.tests)) {
                if (stepKey === 'undefined') {
                    continue
                }
                const step = scenario.tests[stepKey as any]
                for (const [propName, value] of this._propertiesOf(step)) {
                    testCase.property(propName, value)
                }
            }

            testCase.standardOutput(`\n${stepsOutput}\n`)
        }
        return builder
    }

    private _addSuiteToBuilder(
        builder: any,
        runner: RunnerStats,
        specFileName: string,
        suite: SuiteStats
    ) {

        const filePath = specFileName.replace(process.cwd(), '.')
        const suiteName = !this.options.suiteNameFormat || this.options.suiteNameFormat instanceof RegExp
            ? this._prepareName(suite.title)
            : this.options.suiteNameFormat({ name: this.options.suiteNameFormat.name, suite })

        const testSuite = builder.testSuite()
            .name(suiteName)
            .timestamp(suite.start)
            .time(suite._duration / 1000)
            .property('specId', 0)
            .property(this._suiteTitleLabel, suite.title)
            .property('capabilities', runner.sanitizedCapabilities)
            .property(this._fileNameLabel, filePath)
        this._suiteNodes.push({ node: testSuite, suite })

        suite = this._addFailedHooks(suite)

        for (const testKey of Object.keys(suite.tests)) {
            if (testKey === 'undefined') { // fix cucumber hooks crashing reporter (INFO: we may not need this anymore)
                continue
            }

            const test = suite.tests[testKey as any]
            const classNameFormat = this.options.classNameFormat
                ? this.options.classNameFormat({ packageName: this._packageName, suite })
                : `${this._packageName}.${(suite.fullTitle || suite.title).replace(/\s/g, '_')}`
            this._buildTestCase(testSuite, test, filePath, classNameFormat)
        }
        return builder
    }

    private _buildJunitXml(runner: RunnerStats) {
        const builder = (junitReportBuilder as unknown as JUnitReportBuilder).newBuilder()
        if (runner.config.hostname !== undefined && runner.config.hostname.indexOf('browserstack') > -1) {
            // NOTE: deviceUUID is used to build sanitizedCapabilities resulting in a ever-changing package name in runner.sanitizedCapabilities when running Android tests under Browserstack. (i.e. ht79v1a03938.android.9)
            // NOTE: platformVersion is used to build sanitizedCapabilities which can be incorrect and includes a minor version for iOS which is not guaranteed to be the same under Browserstack.
            const browserstackSanitizedCapabilities = [
                // @ts-expect-error capability only exists when running on BrowserStack
                (runner.capabilities).device,
                // @ts-expect-error capability only exists when running on BrowserStack
                (runner.capabilities).os,
                // @ts-expect-error capability only exists when running on BrowserStack
                ((runner.capabilities).os_version || '').replace(/\./g, '_'),
            ]
                .filter(Boolean)
                .map((capability) => capability!.toLowerCase())
                .join('.')
                .replace(/ /g, '') || runner.sanitizedCapabilities
            this._packageName = this.options.packageName || browserstackSanitizedCapabilities
        } else {
            this._packageName = this.options.packageName || runner.sanitizedCapabilities
        }
        const isCucumberFrameworkRunner = runner.config.framework === 'cucumber'
            || Object.values(this.suites).some((suite) => suite.type === 'feature' || suite.type === 'scenario')
        if (isCucumberFrameworkRunner) {
            this._packageName = `CucumberJUnitReport-${this._packageName}`
            this._suiteTitleLabel = 'featureName'
            this._fileNameLabel = 'featureFile'
        } else {
            this._suiteTitleLabel = 'suiteName'
            this._fileNameLabel = 'file'
        }

        /**
         * Each suite is associated with at most one spec. Basename matching is
         * required for Jasmine (suite.file is filename-only, issue #13052), but
         * grouped specs can share that basename. Without this set the same
         * suites would be emitted once per matching spec.
         *
         * Ambiguous filename-only suites are not claimed by the first matching
         * spec. They are emitted afterwards with the suite's own basename so
         * results are not attributed to an arbitrary full path.
         */
        const assignedSuiteKeys = new Set<string>()
        this._suiteNodes = []
        this._lateTestCases = []
        runner.specs.forEach((specFileName) => {
            if (isCucumberFrameworkRunner) {
                this._buildOrderedReport(builder, runner, specFileName, 'feature', isCucumberFrameworkRunner, assignedSuiteKeys)
                this._buildOrderedReport(builder, runner, specFileName, 'scenario', isCucumberFrameworkRunner, assignedSuiteKeys)
            } else {
                this._buildOrderedReport(builder, runner, specFileName, '', isCucumberFrameworkRunner, assignedSuiteKeys)
            }
        })
        this._addAmbiguousBasenameSuites(builder, runner, isCucumberFrameworkRunner, assignedSuiteKeys)
        this._lateTestCases.forEach((add) => add())
        this._addAllHookOutput()
        return builder.build() as unknown as string
    }

    /**
     * The output of a contextless all-hook goes to the testsuite of its suite (K28): a hook of
     * the root suite to the first testsuite (before all) or the last one (after all).
     */
    private _addAllHookOutput() {
        const hooksOf = new Map<SuiteStats | undefined, HookStats[]>()
        const written = new Set(this._hookTestCases.values())
        for (const suite of [this.currentSuites[0], ...Object.values(this.suites)]) {
            for (const hook of (suite?.hooks ?? []).filter((hook) => isContextlessAllHook(hook) && !written.has(hook))) {
                const owner = this.hookOwner(hook)
                const key = owner instanceof SuiteStats ? owner : undefined
                hooksOf.set(key, [...(hooksOf.get(key) ?? []), hook])
            }
        }
        const rootHooks = hooksOf.get(undefined) ?? []
        this._suiteNodes.forEach(({ node, suite }, index) => {
            const hooks = [
                ...(index === 0 ? rootHooks.filter((hook) => hook.hookKind === 'beforeAll') : []),
                ...(hooksOf.get(suite) ?? []),
                ...(index === this._suiteNodes.length - 1 ? rootHooks.filter((hook) => hook.hookKind === 'afterAll') : [])
            ]
            for (const hook of hooks) {
                for (const [name, value] of Object.entries(this._hookInformation.get(hook)?.properties ?? {})) {
                    node.property(name, value)
                }
            }
            const text = hooks
                .map((hook) => this._getStandardOutput({ uid: hook.uid, output: hook.output ?? [] }, this._hookInformation.get(hook)))
                .filter(Boolean)
                .join('\n')
            if (text) {
                // junit-report-builder has no system-out for a testsuite; 5.1.2 `build(parentElement)` returns the testsuite element
                const build = node.build.bind(node)
                node.build = (parent?: any) => {
                    const element = build(parent)
                    element.ele('system-out').cdata(`\n${text}\n`)
                    return element
                }
            }
        })
    }

    private _buildOrderedReport(
        builder: JUnitReportBuilder,
        runner: RunnerStats,
        specFileName: string,
        type: string,
        isCucumberFrameworkRunner: boolean,
        assignedSuiteKeys: Set<string>
    ) {
        const suiteKeys = Object.keys(this.suites)

        if (suiteKeys.length === 0) {
            /**
             * Because this function gets called twice for Cucumber, this conditional is to ensure that
             * Cucumber and Mocha generate the same Junit report for empty suites. Otherwise, Cucumber reporter
             * would generate two <testsuite>.
             */
            if (!isCucumberFrameworkRunner || (isCucumberFrameworkRunner && type === 'feature')) {
                // Only create a test case if there was an actual error
                // When no tests match filters (e.g., Cucumber tags), we should not report any tests
                if (this.runnerStat?.error) {
                    const testCase = builder.testSuite().testCase().className('').name('')
                    return testCase.failure(this.runnerStat.error)
                }
                return builder
            }
        }

        for (const suiteKey of Object.keys(this.suites)) {
            /**
             * ignore root before all
             */
            /* istanbul ignore if  */
            if (suiteKey.match(/^"before all"/)) {
                continue
            }

            if (assignedSuiteKeys.has(suiteKey)) {
                continue
            }

            const suite = this.suites[suiteKey]
            /**
             * Only assign a suite to this spec when the file match is unique.
             * Filename-only Jasmine suites that collide across grouped specs
             * are left unassigned here and emitted later without a full path.
             */
            if (this._suiteFileAssociation(specFileName, suite.file, runner?.specs) !== 'unique') {
                continue
            }

            if (isCucumberFrameworkRunner && suite.type === type) {
                assignedSuiteKeys.add(suiteKey)
                builder = this._addCucumberFeatureToBuilder(builder, runner, specFileName, suite)
            } else if (!isCucumberFrameworkRunner) {
                assignedSuiteKeys.add(suiteKey)
                builder = this._addSuiteToBuilder(builder, runner, specFileName, suite)
            }
        }
        return builder
    }

    /**
     * Emit filename-only suites that matched more than one grouped spec. They
     * still belong in the report (issue #13052) but must not inherit the first
     * spec's full path.
     */
    private _addAmbiguousBasenameSuites(
        builder: JUnitReportBuilder,
        runner: RunnerStats,
        isCucumberFrameworkRunner: boolean,
        assignedSuiteKeys: Set<string>
    ) {
        const types = isCucumberFrameworkRunner ? ['feature', 'scenario'] : ['']
        for (const type of types) {
            for (const suiteKey of Object.keys(this.suites)) {
                if (suiteKey.match(/^"before all"/) || assignedSuiteKeys.has(suiteKey)) {
                    continue
                }

                const suite = this.suites[suiteKey]
                if (isCucumberFrameworkRunner && suite.type !== type) {
                    continue
                }
                if (
                    !suite.file ||
                    !this._isBasenameOnly(this._toFilePath(suite.file)) ||
                    this._matchingSpecCount(suite.file, runner.specs) <= 1
                ) {
                    continue
                }

                assignedSuiteKeys.add(suiteKey)
                builder = isCucumberFrameworkRunner
                    ? this._addCucumberFeatureToBuilder(builder, runner, suite.file, suite)
                    : this._addSuiteToBuilder(builder, runner, suite.file, suite)
            }
        }
        return builder
    }

    private _informationOf(test: Pick<TestStats, 'uid'>) {
        const hook = this._hookTestCases.get(test)
        if (hook) {
            return this._takenHooks.has(hook) ? undefined : this._hookInformation.get(hook)
        }
        return this._testToAdditionalInformation[test.uid]
    }

    // the hooks of the context before the test, then the test
    private _ownersOf(test: Pick<TestStats, 'output'>, info?: JunitReporterAdditionalInformation) {
        return [
            ...(info?.hooks ?? []).map((hook) => ({ info: this._hookInformation.get(hook), output: hook.output ?? [] })),
            { info, output: test.output }
        ]
    }

    private _propertiesOf(test: Pick<TestStats, 'uid' | 'output'>) {
        return this._ownersOf(test, this._informationOf(test)).flatMap(({ info }) => Object.entries(info?.properties ?? {}))
    }

    private _getStandardOutput(test: Pick<TestStats, 'uid' | 'output'>, info = this._informationOf(test)) {
        const owners = this._ownersOf(test, info)
        let consoleOutput = ''
        if (this._addWorkerLogs) {
            consoleOutput = owners.map((owner) => owner.info?.workerConsoleLog ?? '').join('')
        }
        const commandText = this._getCommandStandardOutput({ output: owners.flatMap((owner) => owner.output) })
        let result = ''
        if (consoleOutput !== '') {
            result += consoleOutput
        }
        if (commandText !== '' && consoleOutput !== '') {
            result += '\n...command output...\n\n'
        }
        result += commandText

        return result
    }

    private _getCommandStandardOutput(test: Pick<TestStats, 'output'>) {
        const standardOutput: string[] = []
        test.output.forEach((data) => {
            switch (data.type) {
            case 'command':
                standardOutput.push(
                    data.method
                        ? `COMMAND: ${data.method.toUpperCase()} ` +
                            `${data.endpoint.replace(':sessionId', data.sessionId)} - ${this._format(data.body)}`
                        : `COMMAND: ${data.command} - ${this._format(data.params)}`
                )
                break
            case 'result':
                standardOutput.push(`RESULT: ${this._format(data.body)}`)
                break
            }
        })
        return standardOutput.length ? standardOutput.join('\n') : ''
    }

    private _format(val: any) {
        return JSON.stringify(limit(val))
    }

    private _toFilePath(file: string) {
        return file.startsWith('file://') ? url.fileURLToPath(file) : file
    }

    private _isBasenameOnly(file: string) {
        return !file.includes('/') && !file.includes('\\')
    }

    private _fileNamesEqual(file1: string, file2: string) {
        return file1.localeCompare(file2, undefined, { sensitivity: this._isWindows ? 'accent' : 'variant' }) === 0
    }

    private _matchingSpecCount(suiteFile: string, runnerSpecs: string[]) {
        const suiteBase = path.basename(this._toFilePath(suiteFile))
        return runnerSpecs.filter((spec) => (
            this._fileNamesEqual(path.basename(this._toFilePath(spec)), suiteBase)
        )).length
    }

    /**
     * Decide whether a suite can be tied to a specific runner spec.
     * - unique: full path match, or a filename-only Jasmine suite whose
     *   basename appears once in runner.specs
     * - ambiguous: filename-only suite that matches multiple grouped specs
     * - none: not the same file
     */
    private _suiteFileAssociation(
        specFileName?: string,
        suiteFile?: string,
        runnerSpecs: string[] = []
    ): 'unique' | 'ambiguous' | 'none' {
        if (!this._sameFileName(specFileName, suiteFile)) {
            return 'none'
        }
        if (!suiteFile) {
            return 'unique'
        }

        const suitePath = this._toFilePath(suiteFile)
        if (!this._isBasenameOnly(suitePath)) {
            return 'unique'
        }

        return this._matchingSpecCount(suiteFile, runnerSpecs) > 1 ? 'ambiguous' : 'unique'
    }

    private _sameFileName(file1?: string, file2?: string) {
        if (!file1 && !file2) {
            return true
        }
        if (!file1 || !file2) {
            return false
        }

        file1 = this._toFilePath(file1)
        file2 = this._toFilePath(file2)

        /**
         * Jasmine provides only filenames (e.g. `happyPath.spec.js`) while
         * `runner.specs` contains full paths. Compare basenames when either
         * side has no directory separator (issue #13052).
         */
        if (this._isBasenameOnly(file1) || this._isBasenameOnly(file2)) {
            file1 = path.basename(file1)
            file2 = path.basename(file2)
        }

        return this._fileNamesEqual(file1, file2)
    }
}

export * from './common/api.js'
export default JunitReporter
