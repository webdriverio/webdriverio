import type { EventEmitter } from 'node:events'

import { Status } from '@cucumber/cucumber'
import type { PickleFilter } from '@cucumber/cucumber'
import type { Feature, Pickle, PickleStep, TestStep, TestStepResult, TestCaseFinished, PickleTag, Tag } from '@cucumber/messages'

import CucumberEventListener from './cucumberEventListener.js'
import { getFeatureId, formatMessage, getStepType, buildStepPayload } from './utils.js'
import type { ReporterScenario } from './constants.js'
import type { ReporterOptions } from './types.js'

export default class CucumberReporter {
    public eventListener: CucumberEventListener
    public failedCount = 0

    private _tagsInTitle: boolean
    private _scenarioLevelReport: boolean
    private _featureStart?: Date
    private _scenarioStart?: Date
    private _testStart?: Date

    constructor (
        eventBroadcaster: EventEmitter,
        pickleFilter: PickleFilter,
        private _options: ReporterOptions,
        private _cid: string,
        private _specs: string[],
        private _reporter: EventEmitter
    ) {
        this._tagsInTitle = this._options.tagsInTitle || false
        this._scenarioLevelReport = this._options.scenarioLevelReporter

        this.eventListener = new CucumberEventListener(eventBroadcaster, pickleFilter)
            .on('before-feature', this.handleBeforeFeature.bind(this))
            .on('before-scenario', this.handleBeforeScenario.bind(this))
            .on('after-scenario', this.handleAfterScenario.bind(this))
            .on('after-feature', this.handleAfterFeature.bind(this))

        if (!this._scenarioLevelReport) {
            this.eventListener
                .on('before-step', this.handleBeforeStep.bind(this))
                .on('after-step', this.handleAfterStep.bind(this))
        }
    }

    handleBeforeFeature (uri: string, feature: Feature) {
        this._featureStart = new Date()

        this.emit('suite:start', {
            uid: getFeatureId(uri, feature),
            title: this.getTitle(feature),
            type: 'feature',
            file: uri,
            tags: feature.tags,
            description: feature.description,
            keyword: feature.keyword
        })
    }

    handleBeforeScenario (
        uri: string,
        feature: Feature,
        scenario: ReporterScenario
    ) {
        this._scenarioStart = new Date()
        this._testStart = new Date()

        this.emit(this._scenarioLevelReport ? 'test:start' : 'suite:start', {
            uid: scenario.id,
            title: this.getTitle(scenario),
            parent: getFeatureId(uri, feature),
            type: 'scenario',
            file: uri,
            tags: scenario.tags,
            rule: scenario.rule
        })
    }

    handleBeforeStep (
        uri: string,
        feature: Feature,
        scenario: Pickle,
        step: PickleStep | TestStep
    ) {
        this._testStart = new Date()
        const type = getStepType(step)
        const payload = buildStepPayload(uri, feature, scenario, step as PickleStep, { type })

        this.emit(`${type}:start`, payload)
    }

    handleAfterStep (
        uri: string,
        feature: Feature,
        scenario: Pickle,
        step: PickleStep | TestStep,
        result: TestStepResult
    ) {
        const type = getStepType(step)
        if (type === 'hook') {
            return this.afterHook(uri, feature, scenario, step, result)
        }
        return this.afterTest(uri, feature, scenario, step as PickleStep, result)
    }

    afterHook (
        uri: string,
        feature: Feature,
        scenario: Pickle,
        step: TestStep,
        result: TestStepResult,
    ) {
        let error
        if (result.message) {
            error = new Error(result.message.split('\n')[0])
            error.stack = result.message
        }

        const payload = buildStepPayload(uri, feature, scenario, step as PickleStep, {
            type: 'hook',
            state: result.status,
            error,
            duration: Date.now() - this._testStart!?.getTime()
        })

        this.emit('hook:end', payload)
    }

    afterTest (
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
        let title = step
            ? step?.text
            : this.getTitle(scenario)

        if (result.status === Status.UNDEFINED) {
            if (this._options.ignoreUndefinedDefinitions) {
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
        } else if (result.status === Status.AMBIGUOUS && this._options.failAmbiguousDefinitions) {
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
            file: uri
        }

        const payload = step
            ? buildStepPayload(uri, feature, scenario, step, {
                type: 'step',
                ...common
            })
            : {
                type: 'scenario',
                uid: scenario.id,
                parent: getFeatureId(uri, feature),
                tags: scenario.tags,
                ...common
            }

        this.emit('test:' + state, payload)
    }

    handleAfterScenario (
        uri: string,
        feature: Feature,
        scenario: Pickle,
        result: TestStepResult
    ) {
        if (this._scenarioLevelReport) {
            return this.afterTest(uri, feature, scenario, { id: scenario.id } as PickleStep, result)
        }

        this.emit('suite:end', {
            uid: scenario.id,
            title: this.getTitle(scenario),
            parent: getFeatureId(uri, feature),
            type: 'scenario',
            file: uri,
            duration: Date.now() - this._scenarioStart!?.getTime(),
            tags: scenario.tags
        })
    }

    handleAfterFeature (uri: string, feature: Feature) {
        this.emit('suite:end', {
            uid: getFeatureId(uri, feature),
            title: this.getTitle(feature),
            type: 'feature',
            file: uri,
            duration: Date.now() - this._featureStart!?.getTime(),
            tags: feature.tags
        })
    }

    emit (event: string, payload: any) {
        const message = formatMessage({ payload })

        message.cid = this._cid
        message.specs = this._specs
        message.uid = payload.uid

        this._reporter.emit(event, message)
    }

    getTitle (featureOrScenario: Feature | Pickle) {
        const name = featureOrScenario.name
        const tags = featureOrScenario.tags
        if (!this._tagsInTitle || !tags || !tags.length) {
            return name
        }
        return `${tags.map((tag: PickleTag | Tag) => tag.name).join(', ')}: ${name}`
    }
}
