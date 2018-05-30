import Jasmine from 'jasmine'
import { runTestInFiberContext, executeHooksWithArgs } from 'wdio-config'
import logger from 'wdio-logger'

import JasmineReporter from './reporter'

const INTERFACES = {
    bdd: ['beforeAll', 'beforeEach', 'it', 'xit', 'fit', 'afterEach', 'afterAll']
}
const NOOP = function noop () {}
const DEFAULT_TIMEOUT_INTERVAL = 60000

const log = logger('wdio-mocha-framework')

/**
 * Jasmine 2.x runner
 */
class JasmineAdapter {
    constructor (cid, config, specs, capabilities, reporter) {
        this.cid = cid
        this.config = config
        this.capabilities = capabilities
        this.specs = specs
        this.jrunner = {}

        this.jasmineNodeOpts = Object.assign({
            cleanStack: true
        }, config.jasmineNodeOpts)

        this.reporter = new JasmineReporter(reporter, {
            cid: this.cid,
            capabilities: this.capabilities,
            specs: this.specs,
            cleanStack: this.jasmineNodeOpts.cleanStack
        })
    }

    async run () {
        const self = this

        this.jrunner = new Jasmine()
        const { jasmine } = this.jrunner

        this.jrunner.randomizeTests(Boolean(this.jasmineNodeOpts.random))

        this.jrunner.projectBaseDir = ''
        this.jrunner.specDir = ''
        this.jrunner.addSpecFiles(this.specs)

        jasmine.DEFAULT_TIMEOUT_INTERVAL = this.jasmineNodeOpts.defaultTimeoutInterval || DEFAULT_TIMEOUT_INTERVAL
        jasmine.getEnv().addReporter(this.reporter)

        /**
         * Filter specs to run based on jasmineNodeOpts.grep and jasmineNodeOpts.invert
         */
        jasmine.getEnv().specFilter = ::this.customSpecFilter

        /**
         * enable expectHandler
         */
        const { expectationResultHandler } = this.jasmineNodeOpts
        const handler = typeof expectationResultHandler === 'function'
            ? expectationResultHandler
            : jasmine.Spec.prototype.addExpectationResult
        jasmine.Spec.prototype.addExpectationResult = handler

        /**
         * wrap commands with wdio-sync
         */
        INTERFACES['bdd'].forEach((fnName) => runTestInFiberContext(
            ['it', 'fit'],
            this.config.beforeHook,
            this.config.afterHook,
            fnName
        ))

        /**
         * for a clean stdout we need to avoid that Jasmine initialises the
         * default reporter
         */
        Jasmine.prototype.configureDefaultReporter = NOOP

        /**
         * wrap Suite and Spec prototypes to get access to their data
         */
        let beforeAllMock = jasmine.Suite.prototype.beforeAll
        jasmine.Suite.prototype.beforeAll = function (...args) {
            self.lastSpec = this.result
            beforeAllMock.apply(this, args)
        }
        let executeMock = jasmine.Spec.prototype.execute
        jasmine.Spec.prototype.execute = function (...args) {
            self.lastTest = this.result
            self.lastTest.start = new Date().getTime()
            executeMock.apply(this, args)
        }

        await executeHooksWithArgs(this.config.before, [this.capabilities, this.specs])
        let result = await new Promise((resolve) => {
            this.jrunner.env.beforeAll(this.wrapHook('beforeSuite'))
            this.jrunner.env.beforeEach(this.wrapHook('beforeTest'))
            this.jrunner.env.afterEach(this.wrapHook('afterTest'))
            this.jrunner.env.afterAll(this.wrapHook('afterSuite'))

            this.jrunner.onComplete(() => resolve(this.reporter.getFailedCount()))
            this.jrunner.execute()
        })
        await executeHooksWithArgs(this.config.after, [result, this.capabilities, this.specs])
        return result
    }

    customSpecFilter (spec) {
        const { grep, invertGrep } = this.jasmineNodeOpts
        const grepMatch = !grep || spec.getFullName().match(new RegExp(grep)) !== null
        if (grepMatch === Boolean(invertGrep)) {
            spec.pend()
        }
        return true
    }

    /**
     * Hooks which are added as true Mocha hooks need to call done() to notify async
     */
    wrapHook (hookName) {
        return (done) => executeHooksWithArgs(
            this.config[hookName],
            this.prepareMessage(hookName)
        ).then(() => done(), (e) => {
            log.info(`Error in ${hookName} hook: ${e.stack.slice(7)}`)
            done()
        })
    }

    prepareMessage (hookName) {
        const params = { type: hookName }

        switch (hookName) {
        case 'beforeSuite':
        case 'afterSuite':
            params.payload = Object.assign({
                file: this.jrunner.specFiles[0]
            }, this.lastSpec)
            break
        case 'beforeTest':
        case 'afterTest':
            params.payload = Object.assign({
                file: this.jrunner.specFiles[0]
            }, this.lastTest)
            break
        }

        return this.formatMessage(params)
    }

    formatMessage (params) {
        let message = {
            type: params.type
        }

        if (params.err) {
            message.err = {
                message: params.err.message,
                stack: params.err.stack
            }
        }

        if (params.payload) {
            message.title = params.payload.description
            message.fullName = params.payload.fullName || null
            message.file = params.payload.file

            if (params.payload.id && params.payload.id.startsWith('spec')) {
                message.parent = this.lastSpec.description
                message.passed = params.payload.failedExpectations.length === 0
            }

            if (params.type === 'afterTest') {
                message.duration = new Date().getTime() - params.payload.start
            }

            if (typeof params.payload.duration === 'number') {
                message.duration = params.payload.duration
            }
        }

        return message
    }

    expectationResultHandler (origHandler) {
        const { expectationResultHandler } = this.jasmineNodeOpts
        return function (passed, data) {
            try {
                expectationResultHandler.call(this, passed, data)
            } catch (e) {
                /**
                 * propagate expectationResultHandler error if actual assertion passed
                 */
                if (passed) {
                    passed = false
                    data = {
                        passed: false,
                        message: 'expectationResultHandlerError: ' + e.message
                    }
                }
            }

            return origHandler.call(this, passed, data)
        }
    }
}

const adapterFactory = {}
adapterFactory.run = async function (...args) {
    const adapter = new JasmineAdapter(...args)
    const result = await adapter.run()
    return result
}

export default adapterFactory
export { JasmineAdapter, adapterFactory }
