import { Status } from 'cucumber'
import { CucumberEventListener } from './eventListener'
import { createStepArgument } from './utils'
import * as path from 'path'
import logger from '@wdio/logger'

const SETTLE_TIMEOUT = 5000
const log = logger('wdio-cucumber-framework:CucumberWdioEventTranslator')

/**
 * CucumberReporter
 * responsible for accepting the cucumber specific events emitted by CucumberEventListener
 * and emitting the standard WebdriverIO test runtime events
 * The translation is:
 *
 * before-feature/after-feature -> suite:start/suite:end
 * before-scenario/after-scenario -> suite:start/suite:end
 * before-step/after-step -> test:start/test:end
 *
 * The step == test translation doesn't map the semantics of cucumber very well,
 * but does allow WebdriverIO to maintain behavior that's more consistent with Cucumber's
 * expected behavior
 *
 * Note that if you are building Cucumber-specific functionality, you probably
 * want to instead rely directly on the Cucumber-specific events
 */
// TODO - this class name isn't great, becuase it doesn't capture that this propogates the events
// as well as translating
class CucumberWdioEventTranslator {

    constructor (eventBroadcaster, options, cid, specs, reporter) {
        this.capabilities = options.capabilities
        this.tagsInTitle = options.tagsInTitle || false
        this.options = options
        this.cid = cid
        this.specs = specs
        this.failedCount = 0
        this.reporter = reporter
        this.sentMessages = 0 // number of messages sent to the parent
        this.receivedMessages = 0 // number of messages received by the parent

        new CucumberEventListener(eventBroadcaster)
            .on('feature:start', this.handleBeforeFeature.bind(this))
            .on('scenario:start', this.handleBeforeScenario.bind(this))
            .on('step:start', this.handleBeforeStep.bind(this))
            .on('step:end', this.handleAfterStep.bind(this))
            .on('scenario:end', this.handleAfterScenario.bind(this))
            .on('feature:end', this.handleAfterFeature.bind(this))
    }

    handleBeforeFeature ({uri, feature}) {
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
        this.emit('feature:start', feature)
    }

    handleBeforeScenario ({uri, feature, scenario}) {
        this.scenarioStart = new Date()
        this.testStart = new Date()
        log.trace(`handling before-scenario event from cucumber: ${JSON.stringify({feature, scenario})}`)
        this.emit('suite:start', {
            uid: this.getUniqueIdentifier(scenario),
            title: this.getTitle(scenario),
            parent: this.getUniqueIdentifier(feature),
            type: 'suite',
            file: uri,
            tags: scenario.tags
        })
    }

    handleBeforeStep ({uri, feature, scenario, step, sourceLocation}) {
        this.testStart = new Date()
        log.debug(`handling before-step event from cucumber: ${JSON.stringify({feature, scenario, step})}`)
        this.emit('test:start', {
            uid: this.getUniqueIdentifier(step),
            title: step.text,
            type: 'test',
            file: uri,
            parent: this.getUniqueIdentifier(scenario, sourceLocation),
            duration: new Date() - this.testStart,
            tags: scenario.tags,
            featureName: feature.name,
            scenarioName: scenario.name,
            argument: createStepArgument(step)
        })
    }

    handleAfterStep ({uri, feature, scenario, step, result, sourceLocation}) {
        log.debug(`handling after-step event from cucumber: ${JSON.stringify({feature, scenario, step, result})}`)
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
        let stepTitle = step.text || step.keyword || 'Undefined Step'
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

        this.emit('test:' + e, {
            uid: this.getUniqueIdentifier(step),
            title: stepTitle.trim(),
            type: 'test',
            file: uri,
            parent: this.getUniqueIdentifier(scenario, sourceLocation),
            error: error,
            duration: new Date() - this.testStart,
            tags: scenario.tags,
            keyword: step.keyword,
            argument: createStepArgument(step)
        })
    }

    handleAfterScenario ({uri, feature, scenario, sourceLocation}) {
        log.debug(`Handling after-scenario event from cucumber ${JSON.stringify({feature, scenario, sourceLocation})}`)
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

    handleAfterFeature ({uri, feature}) {
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
        const message = {
            event: event,
            cid: this.cid,
            uid: payload.uid,
            title: payload.title,
            pending: payload.pending || false,
            parent: payload.parent || null,
            type: payload.type,
            file: payload.file,
            error: payload.error || {},
            duration: payload.duration,
            runner: {
                [this.cid]: this.capabilities
            },
            specs: this.specs,
            tags: payload.tags || [],
            featureName: payload.featureName,
            scenarioName: payload.scenarioName,
            description: payload.description,
            keyword: payload.keyword || null,
            argument: payload.argument
        }

        log.trace(`Emitting WDIO event of type ${event} with payload: ${JSON.stringify(message)}`)
        this.reporter.emit(event, message)
    }

    send (...args) {
        return process.send.apply(process, args)
    }

    /**
     * wait until all messages were sent to parent
     */
    waitUntilSettled () {
        return new Promise((resolve) => {
            const start = (new Date()).getTime()
            const interval = setInterval(() => {
                const now = (new Date()).getTime()

                if (this.sentMessages !== this.receivedMessages && now - start < SETTLE_TIMEOUT) return
                clearInterval(interval)
                resolve()
            }, 100)
        })
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
        let name
        let line

        if (target.type === 'Hook') {
            name = path.basename(target.location.uri)
            line = target.location.line
        } else if (target.type === 'ScenarioOutline') {
            name = target.name || target.text
            line = sourceLocation.line

            target.examples[0].tableHeader.cells.forEach((header, idx) => {
                if (name.indexOf('<' + header.value + '>') > -1) {
                    target.examples[0].tableBody.forEach((tableEntry) => {
                        if (tableEntry.location.line === sourceLocation.line) {
                            name = name.replace('<' + header.value + '>', tableEntry.cells[idx].value)
                        }
                    })
                }
            })
        } else {
            name = target.name || target.text
            const location = target.location || target.locations[0]
            line = (location && location.line) || ''
        }

        return name + line
    }
}

export default CucumberWdioEventTranslator
