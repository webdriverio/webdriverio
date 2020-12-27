import { EventEmitter } from 'events'
import { Status } from '@cucumber/cucumber'
import { messages } from '@cucumber/messages'

import CucumberEventListener from './cucumberEventListener'
import { getFeatureId, formatMessage, getStepType, buildStepPayload } from './utils'
import type { ReporterOptions } from './types'

class CucumberReporter {
    public eventListener: CucumberEventListener
    public failedCount = 0

    private _tagsInTitle: boolean
    private _scenarioLevelReport: boolean
    private _featureStart?: Date
    private _scenarioStart?: Date
    private _testStart?: Date

    constructor (
        eventBroadcaster: EventEmitter,
        private _options: ReporterOptions,
        private _cid: string,
        private _specs: string[],
        private _reporter: EventEmitter
    ) {
        this._tagsInTitle = this._options.tagsInTitle || false
        this._scenarioLevelReport = this._options.scenarioLevelReporter

        this.eventListener = new CucumberEventListener(eventBroadcaster)
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

    handleBeforeFeature (uri: string, feature: messages.GherkinDocument.IFeature) {
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
        feature: messages.GherkinDocument.IFeature,
        scenario: messages.IPickle
    ) {
        this._scenarioStart = new Date()
        this._testStart = new Date()

        this.emit(this._scenarioLevelReport ? 'test:start' : 'suite:start', {
            uid: scenario.id,
            title: this.getTitle(scenario),
            parent: getFeatureId(uri, feature),
            type: 'scenario',
            file: uri,
            tags: scenario.tags
        })
    }

    handleBeforeStep (
        uri: string,
        feature: messages.GherkinDocument.IFeature,
        scenario: messages.IPickle,
        step: messages.Pickle.IPickleStep
    ) {
        this._testStart = new Date()
        const type = getStepType(step)
        const payload = buildStepPayload(uri, feature, scenario, step, { type })

        this.emit(`${type}:start`, payload)
    }

    handleAfterStep (
        uri: string,
        feature: messages.GherkinDocument.IFeature,
        scenario: messages.IPickle,
        step: messages.Pickle.IPickleStep,
        result: messages.TestStepFinished.ITestStepResult
    ) {
        const type = getStepType(step)
        if (type === 'hook') {
            return this.afterHook(uri, feature, scenario, step, result)
        }
        return this.afterTest(uri, feature, scenario, step, result)
    }

    afterHook (
        uri: string,
        feature: messages.GherkinDocument.IFeature,
        scenario: messages.IPickle,
        step: messages.Pickle.IPickleStep,
        result: messages.TestStepFinished.ITestStepResult,
    ) {
        const payload = buildStepPayload(uri, feature, scenario, step, {
            type: 'hook',
            state: result.status,
            error: result.message as string,
            duration: Date.now() - this._testStart!?.getTime()
        })

        this.emit('hook:end', payload)
    }

    afterTest (
        uri: string,
        feature: messages.GherkinDocument.IFeature,
        scenario: messages.IPickle,
        step: messages.Pickle.IPickleStep,
        result: messages.TestStepFinished.ITestStepResult
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
        case Status.SKIPPED:
        case Status.AMBIGUOUS:
            state = 'pending'
        }
        let error = result.message
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

                error = (step ? `Step "${title}" is not defined` : `Scenario ${title} has undefined steps`) +
                    'You can ignore this error by setting cucumberOpts.ignoreUndefinedDefinitions as true.'
                // error.stack = step ? `${step.uri}:${step.line}` : `${scenario.uri}:${scenario.line}`
            }
        } else if (result.status === Status.FAILED) {
            if (!result.willBeRetried) {
                this.failedCount++
            }
            // if (false === result.exception instanceof Error) {
            //     error = {
            //         message: result.exception,
            //         stack: ''
            //     }
            // }
        } else if (result.status === Status.AMBIGUOUS && this._options.failAmbiguousDefinitions) {
            state = 'fail'
            this.failedCount++
            // error = {
            //     message: result.exception,
            //     stack: ''
            // }
        }

        const common = {
            title: title,
            state,
            error,
            duration: Date.now() - this._testStart!?.getTime(),
            passed: state === 'pass',
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
        feature: messages.GherkinDocument.IFeature,
        scenario: messages.IPickle
    ) {
        // if (this._scenarioLevelReport) {
        //     return this.afterTest(uri, feature, scenario, undefined, undefined, undefined)
        // }

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

    handleAfterFeature (uri: string, feature: messages.GherkinDocument.IFeature) {
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
        let message = formatMessage({ payload })

        message.cid = this._cid
        message.specs = this._specs
        message.uid = payload.uid

        this._reporter.emit(event, message)
    }

    getTitle (featureOrScenario: messages.GherkinDocument.IFeature | messages.IPickle) {
        const name = featureOrScenario.name
        const tags = featureOrScenario.tags
        if (!this._tagsInTitle || !tags || !tags.length) return name
        return `${(tags as messages.IPickle[]).map(tag => tag.name).join(', ')}: ${name}`
    }
}

export default CucumberReporter
