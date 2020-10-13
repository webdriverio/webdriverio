import { Status } from 'cucumber'

import CucumberEventListener from './cucumberEventListener'
import { getTestStepTitle, getUniqueIdentifier, formatMessage, getStepType, buildStepPayload } from './utils'

class CucumberReporter {
    gherkinDocEvents = []

    constructor (eventBroadcaster, options, cid, specs, reporter) {
        this.capabilities = options.capabilities
        this.tagsInTitle = options.tagsInTitle || false
        this.options = options
        this.cid = cid
        this.specs = specs
        this.reporter = reporter
        this.failedCount = 0
        this.scenarioLevelReport = options.scenarioLevelReporter

        this.eventListener = new CucumberEventListener(eventBroadcaster)
            .on('before-feature', this.handleBeforeFeature.bind(this))
            .on('before-scenario', this.handleBeforeScenario.bind(this))
            .on('after-scenario', this.handleAfterScenario.bind(this))
            .on('after-feature', this.handleAfterFeature.bind(this))

        if (!this.scenarioLevelReport) {
            this.eventListener
                .on('before-step', this.handleBeforeStep.bind(this))
                .on('after-step', this.handleAfterStep.bind(this))
        }
    }

    handleBeforeFeature (uri, feature) {
        this.featureStart = new Date()

        this.emit('suite:start', {
            uid: getUniqueIdentifier(feature),
            title: this.getTitle(feature),
            type: 'feature',
            file: uri,
            tags: feature.tags,
            description: feature.description,
            keyword: feature.keyword
        })
    }

    handleBeforeScenario (uri, feature, scenario) {
        this.scenarioStart = new Date()
        this.testStart = new Date()

        this.emit(this.scenarioLevelReport ? 'test:start' : 'suite:start', {
            uid: getUniqueIdentifier(scenario),
            title: this.getTitle(scenario),
            parent: getUniqueIdentifier(feature),
            type: 'scenario',
            file: uri,
            tags: scenario.tags,
            description: scenario.description || feature.description
        })
    }

    handleBeforeStep (uri, feature, scenario, step, /*sourceLocation*/) {
        this.testStart = new Date()
        const type = getStepType(step.type)
        const payload = buildStepPayload(uri, feature, scenario, step, { type })

        this.emit(`${type}:start`, payload)
    }

    handleAfterStep (uri, feature, scenario, step, result, /*sourceLocation*/) {
        const type = getStepType(step.type)

        if (type === 'hook') {
            return this.afterHook(uri, feature, scenario, step, result)
        }
        return this.afterTest(uri, feature, scenario, step, result)
    }

    afterHook (uri, feature, scenario, step, result) {
        const payload = buildStepPayload(uri, feature, scenario, step, {
            type: 'hook',
            state: result.status,
            error: result.exception,
            duration: new Date() - this.testStart
        })

        this.emit('hook:end', payload)
    }

    afterTest (uri, feature, scenario, step, result, sourceLocation = null) {
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
        let error = result.exception
        let title = step ? getTestStepTitle(step.keyword, step.text) : this.getTitle(scenario)

        if (result.status === Status.UNDEFINED) {
            if (this.options.ignoreUndefinedDefinitions) {
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

                error = {
                    message: (step ? `Step "${title}" is not defined` : `Scenario ${title} has undefined steps`) +
                        'You can ignore this error by setting cucumberOpts.ignoreUndefinedDefinitions as true.',
                    stack: step ? `${step.uri}:${step.line}` : `${scenario.uri}:${scenario.line}`
                }
            }
        } else if (result.status === Status.FAILED) {
            if (!result.retried) {
                this.failedCount++
            }
            if (false === result.exception instanceof Error) {
                error = {
                    message: result.exception,
                    stack: ''
                }
            }
        } else if (result.status === Status.AMBIGUOUS && this.options.failAmbiguousDefinitions) {
            state = 'fail'
            this.failedCount++
            error = {
                message: result.exception,
                stack: ''
            }
        }

        const common = {
            title: title,
            state,
            error,
            duration: new Date() - this.testStart,
            passed: state === 'pass',
            file: uri
        }

        const payload = step ? buildStepPayload(uri, feature, scenario, step, {
            type: 'step',
            ...common
        }) : {
            type: 'scenario',
            uid: getUniqueIdentifier(scenario, sourceLocation),
            parent: getUniqueIdentifier(feature),
            tags: scenario.tags,
            ...common
        }
        this.emit('test:' + state, payload)
    }

    handleAfterScenario (uri, feature, scenario, result, sourceLocation) {
        if (this.scenarioLevelReport) {
            return this.afterTest(uri, feature, scenario, undefined, result, sourceLocation)
        }

        this.emit('suite:end', {
            uid: getUniqueIdentifier(scenario, sourceLocation),
            title: this.getTitle(scenario),
            parent: getUniqueIdentifier(feature),
            type: 'scenario',
            file: uri,
            duration: new Date() - this.scenarioStart,
            tags: scenario.tags
        })
    }

    handleAfterFeature (uri, feature) {
        this.emit('suite:end', {
            uid: getUniqueIdentifier(feature),
            title: this.getTitle(feature),
            type: 'feature',
            file: uri,
            duration: new Date() - this.featureStart,
            tags: feature.tags
        })
    }

    emit (event, payload) {
        let message = formatMessage({ payload })

        message.cid = this.cid
        message.specs = this.specs
        message.uid = payload.uid

        this.reporter.emit(event, message)
    }

    getTitle (featureOrScenario) {
        const name = featureOrScenario.name
        const tags = featureOrScenario.tags
        if (!this.tagsInTitle || !tags.length) return name
        return `${tags.map(tag => tag.name).join(', ')}: ${name}`
    }
}

export default CucumberReporter
