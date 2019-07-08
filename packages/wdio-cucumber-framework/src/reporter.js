import { Status } from 'cucumber'

import CucumberEventListener from './cucumberEventListener'
import { createStepArgument } from './utils'
import * as path from 'path'

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
            uid: this.getUniqueIdentifier(feature),
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
            uid: this.getUniqueIdentifier(scenario),
            title: this.getTitle(scenario),
            parent: this.getUniqueIdentifier(feature),
            type: 'suite',
            file: uri,
            tags: scenario.tags
        })
    }

    handleBeforeStep (uri, feature, scenario, step, /*sourceLocation*/) {
        this.testStart = new Date()

        this.emit('test:start', {
            uid: this.getUniqueIdentifier(step),
            title: this.getTestStepTitle(step),
            type: 'test',
            file: uri,
            parent: this.getTestParent(feature, scenario),
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
        let stepTitle = this.getTestStepTitle(step)

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
                    message: err
                }
            }
            this.failedCount++
        } else if (result.status === Status.AMBIGUOUS && this.options.failAmbiguousDefinitions) {
            e = 'fail'
            this.failedCount++
            error = {
                message: result.exception
            }
        }

        const parent = this.getTestParent(feature, scenario)
        const payload = {
            uid: this.getUniqueIdentifier(step),
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
            uid: this.getUniqueIdentifier(scenario, sourceLocation),
            title: this.getTitle(scenario),
            parent: this.getUniqueIdentifier(feature),
            type: 'suite',
            file: uri,
            duration: new Date() - this.scenarioStart,
            tags: scenario.tags
        })
    }

    handleAfterFeature (uri, feature) {
        this.emit('suite:end', {
            uid: this.getUniqueIdentifier(feature),
            title: this.getTitle(feature),
            type: 'suite',
            file: uri,
            duration: new Date() - this.featureStart,
            tags: feature.tags
        })
    }

    emit (event, payload) {
        let message = this.formatMessage({ type: event, payload })

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

    getUriOf (type) {
        if (!type || !type.uri) {
            return
        }

        return type.uri.replace(process.cwd(), '')
    }

    getUniqueIdentifier (target, sourceLocation) {
        if (target.type === 'Hook') {
            return `${path.basename(target.location.uri)}${target.location.line}`
        }

        if (target.type === 'ScenarioOutline') {
            let name = target.name || target.text
            const line = sourceLocation.line || ''

            if (Array.isArray(target.examples)) {
                target.examples[0].tableHeader.cells.forEach((header, idx) => {
                    if (name.indexOf('<' + header.value + '>') === -1) {
                        return
                    }

                    target.examples[0].tableBody.forEach((tableEntry) => {
                        if (tableEntry.location.line === sourceLocation.line) {
                            name = name.replace('<' + header.value + '>', tableEntry.cells[idx].value)
                        }
                    })
                })
            }

            return `${name}${line}`
        }

        const name = target.name || target.text
        const location = target.location || target.locations[0]
        const line = (location && location.line) || ''
        return `${name}${line}`
    }

    getTestParent(feature, scenario) {
        return `${feature.name || 'Undefined Feature'} > ${scenario.name || 'Undefined Scenario'}`
    }

    getTestStepTitle(step) {
        return ((step.keyword || '') + (step.text || 'Undefined Step')).trim()
    }

    getTestFullTitle(parent, stepTitle) {
        return `${parent} > ${stepTitle}`
    }

    formatMessage ({ type, payload = {} }) {
        let message = {
            ...payload,
            type: type
        }

        if (payload.error) {
            message.error = payload.error

            /**
             * hook failures are emitted as "test:fail"
             */
            if (payload.title && payload.title.match(/^"(before|after)( all)*" hook/g)) {
                message.type = 'hook:end'
            }
        }

        /**
         * Add the current test title to the payload for cases where it helps to
         * identify the test, e.g. when running inside a beforeEach hook
         */
        if (payload.ctx && payload.ctx.currentTest) {
            message.currentTest = payload.ctx.currentTest.title
        }

        if (type.match(/Test/)) {
            message.passed = (payload.state === 'passed')
        }

        if (payload.title && payload.parent) {
            payload.fullTitle = this.getTestFullTitle(payload.parent, payload.title)
        }

        return message
    }
}

export default CucumberReporter
