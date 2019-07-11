import { Status } from 'cucumber'

import CucumberEventListener from './cucumberEventListener'
import { createStepArgument, getTestParent, getTestStepTitle, getUniqueIdentifier, formatMessage } from './utils'

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

        this.eventListener = new CucumberEventListener(eventBroadcaster)
            .on('before-feature', this.handleBeforeFeature.bind(this))
            .on('before-scenario', this.handleBeforeScenario.bind(this))
            .on('before-step', this.handleBeforeStep.bind(this))
            .on('after-step', this.handleAfterStep.bind(this))
            .on('after-scenario', this.handleAfterScenario.bind(this))
            .on('after-feature', this.handleAfterFeature.bind(this))
    }

    handleBeforeFeature (uri, feature) {
        this.featureStart = new Date()

        this.emit('suite:start', {
            uid: getUniqueIdentifier(feature),
            title: this.getTitle(feature),
            type: 'suite',
            file: uri,
            tags: feature.tags,
            description: feature.description,
            keyword: feature.keyword
        })
    }

    handleBeforeScenario (uri, feature, scenario) {
        this.scenarioStart = new Date()
        this.testStart = new Date()

        this.emit('suite:start', {
            uid: getUniqueIdentifier(scenario),
            title: this.getTitle(scenario),
            parent: getUniqueIdentifier(feature),
            type: 'suite',
            file: uri,
            tags: scenario.tags
        })
    }

    handleBeforeStep (uri, feature, scenario, step, /*sourceLocation*/) {
        this.testStart = new Date()

        this.emit('test:start', {
            uid: getUniqueIdentifier(step),
            title: getTestStepTitle(step),
            type: 'test',
            file: uri,
            parent: getTestParent(feature, scenario),
            tags: scenario.tags,
            featureName: feature.name,
            scenarioName: scenario.name,
            argument: createStepArgument(step)
        })
    }

    handleAfterStep (uri, feature, scenario, step, result, /*sourceLocation*/) {
        let e = 'undefined'
        switch (result.status) {
        case Status.FAILED:
        case Status.UNDEFINED:
            e = 'fail'
            break
        case Status.PASSED:
            e = 'pass'
            break
        case Status.PENDING:
        case Status.SKIPPED:
        case Status.AMBIGUOUS:
            e = 'pending'
        }
        let error = {}
        let stepTitle = getTestStepTitle(step)

        /**
         * if step name is undefined we are dealing with a hook
         * don't report hooks if no error happened
         */
        if (!step.text && result.status !== Status.FAILED) {
            return
        }

        if (result.status === Status.UNDEFINED) {
            if (this.options.ignoreUndefinedDefinitions) {
                /**
                 * mark test as pending
                 */
                e = 'pending'
                stepTitle += ' (undefined step)'
            } else {
                /**
                 * mark test as failed
                 */
                this.failedCount++

                error = {
                    message: `Step "${stepTitle}" is not defined. You can ignore this error by setting
                              cucumberOpts.ignoreUndefinedDefinitions as true.`,
                    stack: `${step.uri}:${step.line}`
                }
            }
        } else if (result.status === Status.FAILED) {
            /**
             * cucumber failure exception can't get send to parent process
             * for some reasons
             */
            let err = result.exception
            if (err instanceof Error) {
                error = {
                    message: err.message,
                    stack: err.stack
                }
            } else {
                error = {
                    message: err,
                    stack: ''
                }
            }
            this.failedCount++
        } else if (result.status === Status.AMBIGUOUS && this.options.failAmbiguousDefinitions) {
            e = 'fail'
            this.failedCount++
            error = {
                message: result.exception,
                stack: ''
            }
        }

        const parent = getTestParent(feature, scenario)
        const payload = {
            uid: getUniqueIdentifier(step),
            title: stepTitle,
            type: 'test',
            file: uri,
            parent: parent,
            error: error,
            duration: new Date() - this.testStart,
            tags: scenario.tags,
            keyword: step.keyword,
            argument: createStepArgument(step)
        }

        this.emit('test:' + e, payload)
    }

    handleAfterScenario (uri, feature, scenario, sourceLocation) {
        this.emit('suite:end', {
            uid: getUniqueIdentifier(scenario, sourceLocation),
            title: this.getTitle(scenario),
            parent: getUniqueIdentifier(feature),
            type: 'suite',
            file: uri,
            duration: new Date() - this.scenarioStart,
            tags: scenario.tags
        })
    }

    handleAfterFeature (uri, feature) {
        this.emit('suite:end', {
            uid: getUniqueIdentifier(feature),
            title: this.getTitle(feature),
            type: 'suite',
            file: uri,
            duration: new Date() - this.featureStart,
            tags: feature.tags
        })
    }

    emit (event, payload) {
        let message = formatMessage({ type: event, payload })

        message.cid = this.cid
        message.specs = this.specs
        message.uid = payload.uid

        this.reporter.emit(message.type, message)
    }

    getTitle (featureOrScenario) {
        const name = featureOrScenario.name
        const tags = featureOrScenario.tags
        if (!this.tagsInTitle || !tags.length) return name
        return `${tags.map(tag => tag.name).join(', ')}: ${name}`
    }
}

export default CucumberReporter
