import type { IFormatterOptions } from '@cucumber/cucumber'
import { Formatter, Status } from '@cucumber/cucumber'
import type { EventEmitter } from 'node:events'
import path from 'node:path'

import logger from '@wdio/logger'

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
    TestCaseFinished,
    Hook
} from '@cucumber/messages'

import {
    addKeywordToStep,
    getFeatureId,
    formatMessage,
    getRule,
    getStepType,
    buildStepPayload,
    getScenarioDescription
} from './utils.js'

import type { HookParams, ReporterScenario } from './types.js'

export default class CucumberFormatter extends Formatter {
    private _gherkinDocEvents: GherkinDocument[] = []
    private _hookEvent: Hook[] = []
    private _scenarios: Pickle[] = []
    private _testCases: TestCase[] = []
    private _currentTestCase?: TestCaseStarted
    private _currentPickle?: HookParams = {}
    private _suiteMap: Map<string, string> = new Map()
    private _pickleMap: Map<string, string> = new Map()
    private _currentDoc: GherkinDocument = { comments: [] }
    private _startedFeatures: string[] = []

    private reporter: EventEmitter
    private cid: string
    private specs: string[]
    private eventEmitter: EventEmitter
    private scenarioLevelReporter: boolean
    private tagsInTitle: boolean
    private ignoreUndefinedDefinitions: boolean
    private failAmbiguousDefinitions: boolean

    private failedCount = 0

    private _featureStart?: Date
    private _scenarioStart?: Date
    private _testStart?: Date

    constructor(options: IFormatterOptions) {
        super(options)
        let results: TestStepResult[] = []
        options.eventBroadcaster.on('envelope', (envelope: Envelope) => {
            if (envelope.gherkinDocument) {
                this.onGherkinDocument({ ...envelope.gherkinDocument, uri: this.normalizeURI(envelope.gherkinDocument.uri) })
            } else if (envelope.testRunStarted) {
                this.onTestRunStarted()
            } else if (envelope.pickle) {
                this.onPickleAccepted({ ...envelope.pickle, uri: this.normalizeURI(envelope.pickle.uri)!! })
            } else if (envelope.testCase) {
                this.onTestCasePrepared(envelope.testCase)
            } else if (envelope.testCaseStarted) {
                results = []
                this.onTestCaseStarted(envelope.testCaseStarted)
            } else if (envelope.testStepStarted) {
                this.onTestStepStarted(envelope.testStepStarted)
            } else if (envelope.testStepFinished) {
                results.push(envelope.testStepFinished.testStepResult!)
                this.onTestStepFinished(envelope.testStepFinished)
            } else if (envelope.testCaseFinished) {
                /**
                 * only store result if step isn't retried
                 */
                if (envelope.testCaseFinished.willBeRetried) {
                    return log.debug(
                        `test case with id ${envelope.testCaseFinished.testCaseStartedId} will be retried, ignoring result`
                    )
                }
                this.onTestCaseFinished(results)
            } else if (envelope.testRunFinished) {
                this.onTestRunFinished()
            } else if (envelope.hook) {
                this.onHook(envelope.hook)
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
    }

    normalizeURI(uri?: string) {
        return uri ? (path.isAbsolute(uri) ? uri : path.resolve(uri)) : undefined
    }

    emit(event: string, payload: any) {
        const message = formatMessage({ payload })

        message.cid = this.cid
        message.specs = this.specs
        message.uid = payload.uid

        this.reporter.emit(event, message)
    }

    usesSpecGrouping() {
        return this._gherkinDocEvents.length > 1
    }

    featureIsStarted(feature: string) {
        return this._startedFeatures.includes(feature)
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
            duration: Date.now() - this._testStart!?.getTime(),
        })

        this.emit('hook:end', payload)
    }

    afterTest(
        uri: string,
        feature: Feature,
        scenario: Pickle,
        step: PickleStep,
        result: TestStepResult
    ) {
        let state = 'undefined'
        switch (result.status) {
        case Status.FAILED:
        case Status.UNDEFINED:
            state = 'fail'
            break
        case Status.PASSED:
            state = 'pass'
            break
        case Status.PENDING:
            state = 'pending'
            break
        case Status.SKIPPED:
            state = 'skip'
            break
        case Status.AMBIGUOUS:
            state = 'pending'
            break
        }
        let error = result.message ? new Error(result.message) : undefined
        let title = step ? step?.text : this.getTitle(scenario)

        if (result.status === Status.UNDEFINED) {
            if (this.ignoreUndefinedDefinitions) {
                /**
                 * mark test as pending
                 */
                state = 'pending'
                title += ' (undefined step)'
            } else {
                /**
                 * mark test as failed
                 */
                this.failedCount++

                const err = new Error(
                    (step ? `Step "${title}" is not defined. ` : `Scenario ${title} has undefined steps. `) +
                    'You can ignore this error by setting cucumberOpts.ignoreUndefinedDefinitions as true.'
                )

                err.stack = `${err.message}\n\tat Feature(${uri}):1:1\n`
                const featChildren = feature.children?.find(c => scenario.astNodeIds && c.scenario?.id === scenario.astNodeIds[0])
                if (featChildren) {
                    err.stack += `\tat Scenario(${featChildren.scenario?.name}):${featChildren.scenario?.location?.line}:${featChildren.scenario?.location?.column}\n`

                    const featStep = featChildren.scenario?.steps?.find(s => step.astNodeIds && s.id === step.astNodeIds[0])
                    if (featStep) {
                        err.stack += `\tat Step(${featStep.text}):${featStep.location?.line}:${featStep.location?.column}\n`
                    }
                }

                error = err
            }
        } else if (result.status === Status.FAILED && !(result as any as TestCaseFinished).willBeRetried) {
            error = new Error(result.message?.split('\n')[0])
            error.stack = result.message as string
            this.failedCount++
        } else if (result.status === Status.AMBIGUOUS && this.failAmbiguousDefinitions) {
            state = 'fail'
            this.failedCount++
            error = new Error(result.message?.split('\n')[0])
            error.stack = result.message as string
        } else if ((result as any as TestCaseFinished).willBeRetried) {
            state = 'retry'
        }

        const common = {
            title: title,
            state,
            error,
            duration: Date.now() - this._testStart!?.getTime(),
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
                parent: getFeatureId(uri, feature),
                tags: scenario.tags,
                ...common,
            }

        this.emit('test:' + state, payload)
    }

    onGherkinDocument(gherkinDocEvent: GherkinDocument) {
        this._currentPickle = {
            uri: gherkinDocEvent.uri,
            feature: gherkinDocEvent.feature,
        }
        this._gherkinDocEvents.push(gherkinDocEvent)
        this.eventEmitter.emit('getHookParams', this._currentPickle)
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
            uid: getFeatureId(doc.uri as string, doc.feature as Feature),
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
            doc !== this._currentDoc &&
            this.featureIsStarted(this._currentDoc.uri)
        ) {
            const payload = {
                uid: getFeatureId(
                    this._currentDoc.uri as string,
                    this._currentDoc.feature as Feature
                ),
                title: this.getTitle(this._currentDoc.feature),
                type: 'feature',
                file: this._currentDoc.uri,
                duration: Date.now() - this._featureStart!?.getTime(),
                tags: this._currentDoc.feature?.tags,
            }
            this.emit('suite:end', payload)
        }

        if (
            this.usesSpecGrouping() &&
            doc &&
            doc.uri &&
            !this.featureIsStarted(doc.uri)
        ) {
            const payload = {
                uid: getFeatureId(doc.uri as string, doc.feature as Feature),
                title: this.getTitle(doc.feature as Feature),
                type: 'feature',
                file: doc.uri,
                tags: doc.feature?.tags,
                description: doc.feature?.description,
                keyword: doc.feature?.keyword,
            }

            this.emit('suite:start', payload)
            this._currentDoc = doc
            this._startedFeatures.push(doc.uri)
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

        this._currentPickle = { uri, feature, scenario }

        const reporterScenario: ReporterScenario = scenario
        reporterScenario.rule = getRule(
            doc?.feature!,
            this._pickleMap.get(scenario.id)!
        )

        this._scenarioStart = new Date()
        this._testStart = new Date()

        const payload = {
            uid: reporterScenario.id,
            title: this.getTitle(reporterScenario),
            parent: getFeatureId(scenario.uri, doc?.feature as Feature),
            type: 'scenario',
            description: getScenarioDescription(doc?.feature as Feature, this._pickleMap.get(scenario.id)!),
            file: scenario.uri,
            tags: reporterScenario.tags,
            rule: reporterScenario.rule,
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

            this._currentPickle = { uri, feature, scenario, step }

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

    onTestStepFinished(testStepFinishedEvent: TestStepFinished) {
        if (!this.scenarioLevelReporter) {
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
    }

    onTestCaseFinished(results: TestStepResult[]) {
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

        /**
         * propagate the first non passing result or the last one
         */
        const finalResult = results.find((r) => r.status !== Status.PASSED) || results.pop()

        const doc = this._gherkinDocEvents.find(
            (gde) => gde.uri === scenario?.uri
        )
        const uri = doc?.uri
        const feature = doc?.feature
        this._currentPickle = { uri, feature, scenario }

        const payload = {
            uid: scenario.id,
            title: this.getTitle(scenario),
            parent: getFeatureId(doc?.uri as string, doc?.feature as Feature),
            type: 'scenario',
            file: doc?.uri,
            duration: Date.now() - this._scenarioStart!?.getTime(),
            tags: scenario.tags,
        }

        if (this.scenarioLevelReporter) {
            return this.afterTest(uri as string, feature as Feature, scenario, { id: scenario.id } as PickleStep, finalResult as TestStepResult)
        }
        this.emit('suite:end', payload)
    }

    onTestRunFinished() {
        delete this._currentTestCase

        this.eventEmitter.emit('getFailedCount', this.failedCount)

        if (this.usesSpecGrouping()) {
            const payload = {
                uid: getFeatureId(
                    this._currentDoc.uri as string,
                    this._currentDoc.feature as Feature
                ),
                title: this.getTitle(this._currentDoc.feature as Feature),
                type: 'feature',
                file: this._currentDoc.uri,
                duration: Date.now() - this._featureStart!?.getTime(),
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
            uid: getFeatureId(
                gherkinDocEvent.uri as string,
                gherkinDocEvent.feature as Feature
            ),
            title: this.getTitle(gherkinDocEvent.feature as Feature),
            type: 'feature',
            file: gherkinDocEvent.uri,
            duration: Date.now() - this._featureStart!?.getTime(),
            tags: gherkinDocEvent.feature?.tags,
        }

        this.emit('suite:end', payload)
    }
}
