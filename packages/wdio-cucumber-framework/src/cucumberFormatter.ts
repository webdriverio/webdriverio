import type { IFormatterOptions } from '@cucumber/cucumber'
import { Formatter, Status } from '@cucumber/cucumber'
import type { EventEmitter } from 'node:events'
import path from 'node:path'

import logger from '@wdio/logger'

import type { Payload } from './types.js'
import { getFeatureStack, getStepResult, withAmbiguousMessage } from './utils.js'

const log = logger('CucumberFormatter')

import type {
    Envelope,
    GherkinDocument,
    Tag,
    Feature,
    Pickle,
    PickleTag,
    PickleStep,
    TestCase,
    TestCaseStarted,
    TestStep,
    TestStepStarted,
    TestStepFinished,
    TestStepResult,
    Hook,
    StepDefinition
} from '@cucumber/messages'

import {
    addKeywordToStep,
    getFeatureId,
    formatMessage,
    getRule,
    getStepType,
    buildStepPayload,
    getScenarioDescription,
    getScenarioResult
} from './utils.js'

import type { HookParams, ReporterScenario } from './types.js'

export default class CucumberFormatter extends Formatter {
    private _gherkinDocEvents: GherkinDocument[] = []
    private _hookEvent: Hook[] = []
    private _scenarios: Pickle[] = []
    private _testCases: TestCase[] = []
    private _stepDefinitions = new Map<string, StepDefinition>()
    private _currentTestCase?: TestCaseStarted
    private _currentPickle?: HookParams = {}
    private _suiteMap: Map<string, string> = new Map()
    private _pickleMap: Map<string, string> = new Map()
    private _currentDoc: GherkinDocument = { comments: [] }
    /**
     * grouped specs: the uid of the current part of the feature, and how many times
     * each feature started
     */
    private _currentFeatureUid?: string
    private _featureStarts = new Map<string, number>()
    private _featureIds = new Map<string, string>()

    private reporter: EventEmitter
    private cid: string
    private specs: string[]
    private eventEmitter: EventEmitter
    private scenarioLevelReporter: boolean
    private tagsInTitle: boolean
    private ignoreUndefinedDefinitions: boolean
    private failAmbiguousDefinitions: boolean
    private rootDir?: string

    private failedCount = 0
    /** `failedCount` when the attempt started: a retried attempt does not count */
    private _failedCountAtAttemptStart = 0

    private _featureStart?: Date
    private _scenarioStart?: Date
    private _testStart?: Date

    constructor(options: IFormatterOptions) {
        super(options)
        let results: TestStepResult[] = []
        options.eventBroadcaster.on('envelope', (envelope: Envelope) => {
            if (envelope.gherkinDocument) {
                this.onGherkinDocument({ ...envelope.gherkinDocument, ...(envelope.gherkinDocument.uri ? { uri: this.normalizeURI(envelope.gherkinDocument.uri) } : {}) })
            } else if (envelope.testRunStarted) {
                this.onTestRunStarted()
            } else if (envelope.pickle) {
                this.onPickleAccepted({ ...envelope.pickle, uri: this.normalizeURI(envelope.pickle.uri) })
            } else if (envelope.testCase) {
                this.onTestCasePrepared(envelope.testCase)
            } else if (envelope.testCaseStarted) {
                results = []
                this._failedCountAtAttemptStart = this.failedCount
                this.onTestCaseStarted(envelope.testCaseStarted)
            } else if (envelope.testStepStarted) {
                this.onTestStepStarted(envelope.testStepStarted)
            } else if (envelope.testStepFinished) {
                const testStepFinished = this.withAmbiguousMessage(envelope.testStepFinished)
                results.push(testStepFinished.testStepResult!)
                this.onTestStepFinished(testStepFinished)
            } else if (envelope.testCaseFinished) {
                /**
                 * only store result if step isn't retried
                 */
                if (envelope.testCaseFinished.willBeRetried) {
                    log.debug(
                        `test case with id ${envelope.testCaseFinished.testCaseStartedId} will be retried, ignoring result`
                    )
                    // scenario level: the attempt ends as a retry, as in Mocha (step level sends suite:retry at the next attempt)
                    if (this.scenarioLevelReporter) {
                        this.onTestCaseFinished(results, true)
                    }
                    this.failedCount = this._failedCountAtAttemptStart
                    return
                }
                this.onTestCaseFinished(results)
            } else if (envelope.testRunFinished) {
                this.onTestRunFinished()
            } else if (envelope.hook) {
                this.onHook(envelope.hook)
            } else if (envelope.stepDefinition) {
                this._stepDefinitions.set(envelope.stepDefinition.id, envelope.stepDefinition)
            } else {
                // do nothing for other envelopes
            }
        })

        this.reporter = options.parsedArgvOptions._reporter
        this.cid = options.parsedArgvOptions._cid
        this.specs = options.parsedArgvOptions._specs
        this.eventEmitter = options.parsedArgvOptions._eventEmitter
        this.scenarioLevelReporter = options.parsedArgvOptions._scenarioLevelReporter
        this.tagsInTitle = options.parsedArgvOptions._tagsInTitle
        this.ignoreUndefinedDefinitions = options.parsedArgvOptions._ignoreUndefinedDefinitions
        this.failAmbiguousDefinitions = options.parsedArgvOptions._failAmbiguousDefinitions
        this.rootDir = options.parsedArgvOptions._rootDir
    }

    updateCurrentPickle(params: HookParams) {
        this._currentPickle = params
        this.eventEmitter.emit('getHookParams', params)
    }

    normalizeURI(uri: string) {
        return path.isAbsolute(uri) ? uri : path.resolve(uri)
    }

    emit(event: string, payload: Payload) {
        const message = formatMessage({ payload })

        message.cid = this.cid
        message.specs = this.specs
        message.uid = payload.uid

        this.reporter.emit(event, message)
    }

    usesSpecGrouping() {
        return this._gherkinDocEvents.length > 1
    }

    /**
     * The suite uid of the current part of a feature (grouped specs). In a random order,
     * a feature starts again when the run comes back to it: each part has its own uid
     * (`<feature id>#2`, ...), so a reporter does not replace the suite (and the tests)
     * of the earlier part. Scenarios use the feature id as their parent, not this uid:
     * their `fullTitle` (Allure `historyId`) must not depend on the order.
     */
    featurePartUid(uri: string, feature: Feature) {
        return this._currentFeatureUid ?? this.featureId(uri, feature)
    }

    /**
     * the feature uid, once per file (`getFeatureId` reads the file system)
     */
    featureId(uri: string, feature: Feature) {
        let id = this._featureIds.get(uri)
        if (id === undefined) {
            id = getFeatureId(uri, feature, this.rootDir)
            this._featureIds.set(uri, id)
        }
        return id
    }

    getTitle(featureOrScenario: Feature | Pickle) {
        const name = featureOrScenario.name
        const tags = featureOrScenario.tags
        if (!this.tagsInTitle || !tags || !tags.length) {
            return name
        }
        return `${tags.map((tag: PickleTag | Tag) => tag.name).join(', ')}: ${name}`
    }

    afterHook(
        uri: string,
        feature: Feature,
        scenario: Pickle,
        step: TestStep,
        result: TestStepResult
    ) {
        let error
        if (result.message) {
            error = new Error(result.message.split('\n')[0])
            error.stack = result.message
        }

        if (result.status === Status.FAILED) {
            this.failedCount++
        }

        const payload = buildStepPayload(uri, feature, scenario, step as PickleStep, {
            type: 'hook',
            state: result.status,
            error,
            duration: this._testStart
                ? Date.now() - this._testStart.getTime()
                : 0,
        })

        this.emit('hook:end', payload)
    }

    /**
     * @param step  the step, or `undefined` for a scenario that is reported as a test (`scenarioLevelReporter`)
     */
    afterTest(
        uri: string,
        feature: Feature,
        scenario: Pickle,
        step: PickleStep | undefined,
        result: TestStepResult,
        retried = false
    ) {
        const title = step ? step?.text : this.getTitle(scenario)
        const { state, error, pendingReason, titleSuffix, failed } = getStepResult(
            result,
            {
                title,
                isStep: Boolean(step),
                ignoreUndefinedDefinitions: this.ignoreUndefinedDefinitions,
                failAmbiguousDefinitions: this.failAmbiguousDefinitions,
                featureStack: () => getFeatureStack(uri, feature, scenario, step),
            }
        )
        if (failed) {
            this.failedCount++
        }

        const common = {
            title: title,
            state,
            error,
            ...(pendingReason ? { pendingReason } : {}),
            duration: this._testStart
                ? Date.now() - this._testStart.getTime()
                : 0,
            passed: ['pass', 'skip'].includes(state),
            file: uri,
        }

        const payload = step
            ? buildStepPayload(uri, feature, scenario, step, {
                type: 'step',
                ...common,
            })
            : {
                type: 'scenario',
                uid: scenario.id,
                parent: this.featureId(uri, feature),
                tags: scenario.tags,
                ...common,
            }

        /**
         * after `buildStepPayload`, which builds the title of a step from its keyword
         * and text: reporters tell an undefined step from a pending one by this suffix
         */
        if (titleSuffix) {
            payload.title += titleSuffix
        }
        this.emit(retried ? 'test:retry' : 'test:' + state, payload)
        // as Mocha and Jasmine: a final result, then the end of the step or scenario (a retried attempt has none)
        if (!retried) {
            this.emit('test:end', payload)
        }
    }

    onGherkinDocument(gherkinDocEvent: GherkinDocument) {
        this.updateCurrentPickle({
            uri: gherkinDocEvent.uri,
            feature: gherkinDocEvent.feature,
        })

        this._gherkinDocEvents.push(gherkinDocEvent)
    }

    onHook(hookEvent: Hook) {
        this._hookEvent.push(hookEvent)
    }

    onTestRunStarted() {
        if (this.usesSpecGrouping()) {
            return
        }

        const doc = this._gherkinDocEvents[this._gherkinDocEvents.length - 1]

        this._featureStart = new Date()

        const payload = {
            uid: this.featureId(doc.uri as string, doc.feature as Feature),
            title: this.getTitle(doc.feature as Feature),
            type: 'feature',
            file: doc.uri,
            tags: doc.feature?.tags,
            description: doc.feature?.description,
            keyword: doc.feature?.keyword,
        }

        this.emit('suite:start', payload)
    }

    onPickleAccepted(pickleEvent: Pickle) {
        const id = this._suiteMap.size.toString()
        this._suiteMap.set(pickleEvent.id as string, id)
        this._pickleMap.set(id, pickleEvent.astNodeIds[0] as string)
        const scenario = { ...pickleEvent, id }
        this._scenarios.push(scenario)
    }

    onTestCasePrepared(testCase: TestCase) {
        this._testCases.push(testCase)
    }

    onTestCaseStarted(testcase: TestCaseStarted) {
        this._currentTestCase = testcase

        const tc = this._testCases.find((tc) => tc.id === testcase.testCaseId)
        const scenario = this._scenarios.find(
            (sc) => sc.id === this._suiteMap.get(tc?.pickleId as string)
        )
        /* istanbul ignore if */
        if (!scenario) {
            return
        }

        const doc = this._gherkinDocEvents.find(
            (gde) => gde.uri === scenario?.uri
        )
        const uri = doc?.uri
        const feature = doc?.feature

        if (
            this._currentDoc.uri &&
            this._currentDoc.feature &&
            this.usesSpecGrouping() &&
            doc !== this._currentDoc
        ) {
            const payload = {
                uid: this.featurePartUid(this._currentDoc.uri as string, this._currentDoc.feature as Feature),
                title: this.getTitle(this._currentDoc.feature),
                type: 'feature',
                file: this._currentDoc.uri,
                duration: this._featureStart
                    ? Date.now() - this._featureStart.getTime()
                    : 0,
                tags: this._currentDoc.feature?.tags,
            }
            this.emit('suite:end', payload)
        }

        /**
         * start the feature of the scenario when it is not the current one. In a
         * random order the scenarios of the features mix: the feature that ended
         * above starts again later, so each `suite:end` of a feature has its
         * `suite:start`, and the reporters keep each scenario
         */
        if (
            this.usesSpecGrouping() &&
            doc &&
            doc.uri &&
            doc !== this._currentDoc
        ) {
            const starts = (this._featureStarts.get(doc.uri) ?? 0) + 1
            this._featureStarts.set(doc.uri, starts)
            const featureId = this.featureId(doc.uri as string, doc.feature as Feature)
            this._currentFeatureUid = starts === 1 ? featureId : `${featureId}#${starts}`
            const payload = {
                uid: this._currentFeatureUid,
                title: this.getTitle(doc.feature as Feature),
                type: 'feature',
                file: doc.uri,
                tags: doc.feature?.tags,
                description: doc.feature?.description,
                keyword: doc.feature?.keyword,
            }

            this.emit('suite:start', payload)
            this._currentDoc = doc
            // the duration of this part of the feature
            this._featureStart = new Date()
        }
        /**
         * The reporters need to have the keywords, like `Given|When|Then`. They are NOT available
         * on the scenario, they ARE on the feature.
         * This will aad them
         */
        if (scenario.steps && feature) {
            scenario.steps = addKeywordToStep(
                scenario.steps as PickleStep[],
                feature
            )
        }

        this.updateCurrentPickle({ uri, feature, scenario })

        const reporterScenario: ReporterScenario = scenario
        reporterScenario.rule = getRule(
            doc?.feature as Feature,
            this._pickleMap.get(scenario.id)!
        )

        this._scenarioStart = new Date()
        this._testStart = new Date()

        const payload = {
            uid: reporterScenario.id,
            title: this.getTitle(reporterScenario),
            parent: this.featureId(scenario.uri, doc?.feature as Feature),
            type: 'scenario',
            description: getScenarioDescription(doc?.feature as Feature, this._pickleMap.get(scenario.id)!),
            file: scenario.uri,
            tags: reporterScenario.tags,
            rule: reporterScenario.rule,
        }

        /**
         * if we are retrying a scenario, we need to emit the event as `suite:retry` instead of `suite:start`
         */
        const isRetry = typeof testcase.attempt === 'number' && testcase.attempt > 0
        if (!this.scenarioLevelReporter && isRetry) {
            return this.emit('suite:retry', payload)
        }

        this.emit(this.scenarioLevelReporter ? 'test:start' : 'suite:start', payload)
    }

    onTestStepStarted(testStepStartedEvent: TestStepStarted) {
        if (!this.scenarioLevelReporter) {
            const testcase = this._testCases.find(
                (testcase) =>
                    this._currentTestCase &&
                    testcase.id === this._currentTestCase.testCaseId
            )
            const scenario = this._scenarios.find(
                (sc) => sc.id === this._suiteMap.get(testcase?.pickleId as string)
            )
            const teststep = testcase?.testSteps?.find(
                (step) => step.id === testStepStartedEvent.testStepId
            )

            const hook = this._hookEvent.find(
                (h) => h.id === teststep?.hookId
            )

            const step =
                scenario?.steps?.find((s) => s.id === teststep?.pickleStepId) ||
                { ...teststep, text: `${hook?.name || ''} ${hook?.tagExpression || ''}`.trim() } as TestStep

            const doc = this._gherkinDocEvents.find(
                (gde) => gde.uri === scenario?.uri
            )
            const uri = doc?.uri
            const feature = doc?.feature

            /* istanbul ignore if */
            if (!step) {
                return
            }

            this.updateCurrentPickle({ uri, feature, scenario, step })

            this._testStart = new Date()
            const type = getStepType(step)
            const payload = buildStepPayload(
                uri as string,
                feature as Feature,
                scenario as Pickle,
                step as PickleStep,
                { type }
            )

            this.emit(`${type}:start`, payload)
        }
    }

    /**
     * Cucumber 13 sends no message for an ambiguous step: list the matching step definitions
     */
    private withAmbiguousMessage(event: TestStepFinished): TestStepFinished {
        const result = event.testStepResult
        const stepDefinitionIds = () => this._testCases
            .find((tc) => tc.id === this._currentTestCase?.testCaseId)
            ?.testSteps.find((step) => step.id === event.testStepId)
            ?.stepDefinitionIds ?? []
        const withMessage = result && withAmbiguousMessage(result, stepDefinitionIds, this._stepDefinitions)
        return withMessage === result ? event : { ...event, testStepResult: withMessage }
    }

    onTestStepFinished(testStepFinishedEvent: TestStepFinished) {
        if (this.scenarioLevelReporter) {
            return
        }

        const testcase = this._testCases.find(
            (testcase) => testcase.id === this._currentTestCase?.testCaseId
        )
        const scenario = this._scenarios.find(
            (sc) => sc.id === this._suiteMap.get(testcase?.pickleId as string)
        )
        const teststep = testcase?.testSteps?.find(
            (step) => step.id === testStepFinishedEvent.testStepId
        )
        const step =
            scenario?.steps?.find((s) => s.id === teststep?.pickleStepId) ||
            teststep
        const result = testStepFinishedEvent.testStepResult

        const doc = this._gherkinDocEvents.find(
            (gde) => gde.uri === scenario?.uri
        )
        const uri = doc?.uri
        const feature = doc?.feature

        /* istanbul ignore if */
        if (!step) {
            return
        }

        delete this._currentPickle

        const type = getStepType(step)
        if (type === 'hook') {
            return this.afterHook(
                uri as string,
                feature as Feature,
                scenario as Pickle,
                step,
                result
            )
        }

        return this.afterTest(
            uri as string,
            feature as Feature,
            scenario as Pickle,
            step as PickleStep,
            result
        )
    }

    onTestCaseFinished(results: TestStepResult[], retried = false) {
        const tc = this._testCases.find(
            (tc) => tc.id === this._currentTestCase?.testCaseId
        )
        const scenario = this._scenarios.find(
            (sc) => sc.id === this._suiteMap.get(tc?.pickleId as string)
        )

        /* istanbul ignore if */
        if (!scenario) {
            return
        }

        const finalResult = getScenarioResult(results)

        const doc = this._gherkinDocEvents.find(
            (gde) => gde.uri === scenario?.uri
        )
        const uri = doc?.uri
        const feature = doc?.feature
        this.updateCurrentPickle({ uri, feature, scenario })

        const payload = {
            uid: scenario.id,
            title: this.getTitle(scenario),
            parent: this.featureId(doc?.uri as string, doc?.feature as Feature),
            type: 'scenario',
            file: doc?.uri,
            duration: this._scenarioStart
                ? Date.now() - this._scenarioStart.getTime()
                : 0,
            tags: scenario.tags,
        }

        if (this.scenarioLevelReporter) {
            /**
             * no step: the end event has the title, type and parent of the scenario,
             * as its `test:start` event
             */
            return this.afterTest(uri as string, feature as Feature, scenario, undefined, finalResult as TestStepResult, retried)
        }
        this.emit('suite:end', payload)
    }

    onTestRunFinished() {
        delete this._currentTestCase

        this.eventEmitter.emit('getFailedCount', this.failedCount)

        if (this.usesSpecGrouping()) {
            const payload = {
                uid: this.featurePartUid(this._currentDoc.uri as string, this._currentDoc.feature as Feature),
                title: this.getTitle(this._currentDoc.feature as Feature),
                type: 'feature',
                file: this._currentDoc.uri,
                duration: this._featureStart
                    ? Date.now() - this._featureStart.getTime()
                    : 0,
                tags: this._currentDoc.feature?.tags,
            }

            this.emit('suite:end', payload)
            return
        }

        const gherkinDocEvent = this._gherkinDocEvents.pop() // see .push() in `handleBeforeFeature()`

        /* istanbul ignore if */
        if (!gherkinDocEvent) {
            return
        }

        const payload = {
            uid: this.featureId(
                gherkinDocEvent.uri as string,
                gherkinDocEvent.feature as Feature
            ),
            title: this.getTitle(gherkinDocEvent.feature as Feature),
            type: 'feature',
            file: gherkinDocEvent.uri,
            duration: this._featureStart
                ? Date.now() - this._featureStart.getTime()
                : 0,
            tags: gherkinDocEvent.feature?.tags,
        }

        this.emit('suite:end', payload)
    }
}
