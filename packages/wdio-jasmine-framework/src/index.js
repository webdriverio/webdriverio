import Jasmine from 'jasmine'
import { runTestInFiberContext, executeHooksWithArgs } from '@wdio/utils'
import logger from '@wdio/logger'

import JasmineReporter from './reporter'

const INTERFACES = {
    bdd: ['beforeAll', 'beforeEach', 'it', 'xit', 'fit', 'afterEach', 'afterAll']
}
const TEST_INTERFACES = ['it', 'fit', 'xit']
const NOOP = function noop() { }
const DEFAULT_TIMEOUT_INTERVAL = 60000

const log = logger('@wdio/jasmine-framework')

/**
 * Jasmine 2.x runner
 */
class JasmineAdapter {
    constructor(cid, config, specs, capabilities, reporter) {
        this.cid = cid
        this.config = config
        this.capabilities = capabilities
        this.specs = specs
        this.jrunner = {}
        this.totalTests = 0

        this.jasmineNodeOpts = Object.assign({
            cleanStack: true
        }, config.jasmineNodeOpts)

        this.reporter = new JasmineReporter(reporter, {
            cid: this.cid,
            capabilities: this.capabilities,
            specs: this.specs,
            cleanStack: this.jasmineNodeOpts.cleanStack
        })
        this._hasTests = true
    }

    async init() {
        const self = this

        this.jrunner = new Jasmine()
        const { jasmine } = this.jrunner
        const jasmineEnv = jasmine.getEnv()

        this.jrunner.projectBaseDir = ''
        this.jrunner.specDir = ''
        this.jrunner.addSpecFiles(this.specs)

        jasmine.DEFAULT_TIMEOUT_INTERVAL = this.jasmineNodeOpts.defaultTimeoutInterval || DEFAULT_TIMEOUT_INTERVAL
        jasmineEnv.addReporter(this.reporter)

        /**
         * Filter specs to run based on jasmineNodeOpts.grep and jasmineNodeOpts.invert
         */
        jasmineEnv.configure({
            specFilter: this.jasmineNodeOpts.specFilter || this.customSpecFilter.bind(this),
            stopOnSpecFailure: Boolean(this.jasmineNodeOpts.stopOnSpecFailure),
            failSpecWithNoExpectations: Boolean(this.jasmineNodeOpts.failSpecWithNoExpectations),
            failFast: this.jasmineNodeOpts.failFast,
            random: Boolean(this.jasmineNodeOpts.random),
            seed: Boolean(this.jasmineNodeOpts.seed),
            oneFailurePerSpec: Boolean(
                // depcrecated old property
                this.jasmineNodeOpts.stopSpecOnExpectationFailure ||
                this.jasmineNodeOpts.oneFailurePerSpec
            )
        })

        /**
         * enable expectHandler
         */
        jasmine.Spec.prototype.addExpectationResult = this.getExpectationResultHandler(jasmine)

        const hookArgsFn = (context) => [{ ...(self.lastTest || {}) }, context]

        const emitHookEvent = (fnName, eventType) => (_test, _context, { error } = {}) => {
            const title = `"${fnName === 'beforeAll' ? 'before' : 'after'} all" hook`
            const suiteUid = this.reporter.startedSuite ? this.reporter.getUniqueIdentifier(this.reporter.startedSuite) : `root${this.cid}`
            const hook = {
                type: 'hook',
                description: title,
                fullName: title,
                uid: `${suiteUid}-${fnName}`,
                error: error ? { message: error.message } : undefined
            }
            this.reporter.emit('hook:' + eventType, hook)
        }

        /**
         * wrap commands with wdio-sync
         */
        INTERFACES['bdd'].forEach((fnName) => {
            const isTest = TEST_INTERFACES.includes(fnName)
            const beforeHook = [...this.config.beforeHook]
            const afterHook = [...this.config.afterHook]

            /**
             * add beforeAll and afterAll hooks to reporter
             */
            if (fnName.includes('All')) {
                beforeHook.push(emitHookEvent(fnName, 'start'))
                afterHook.push(emitHookEvent(fnName, 'end'))
            }

            runTestInFiberContext(
                isTest,
                isTest ? this.config.beforeTest : beforeHook,
                hookArgsFn,
                isTest ? this.config.afterTest : afterHook,
                hookArgsFn,
                fnName,
                this.cid
            )
        })

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

        this._loadFiles()

        return this
    }

    _loadFiles() {
        try {
            if (Array.isArray(this.jasmineNodeOpts.requires)) {
                this.jrunner.addRequires(this.jasmineNodeOpts.requires)
            }
            if (Array.isArray(this.jasmineNodeOpts.helpers)) {
                this.jrunner.addHelperFiles(this.jasmineNodeOpts.helpers)
            }
            this.jrunner.loadRequires()
            this.jrunner.loadHelpers()
            this.jrunner.loadSpecs()
            this._grep(this.jrunner.env.topSuite())
            this._hasTests = this.totalTests > 0
        } catch (err) {
            log.warn(
                'Unable to load spec files quite likely because they rely on `browser` object that is not fully initialised.\n' +
                '`browser` object has only `capabilities` and some flags like `isMobile`.\n' +
                'Helper files that use other `browser` commands have to be moved to `before` hook.\n' +
                `Spec file(s): ${this.specs.join(',')}\n`,
                'Error: ', err
            )
        }
    }

    _grep(suite) {
        suite.children.forEach((child) => {
            if (Array.isArray(child.children)) {
                return this._grep(child)
            }
            if (this.customSpecFilter(child)) {
                this.totalTests++
            }
        })
    }

    hasTests() {
        return this._hasTests
    }

    async run() {
        /**
         * import and set options for `expect-webdriverio` assertion lib once
         * the framework was initiated so that it can detect the environment
         */
        const { setOptions } = require('expect-webdriverio')
        setOptions({
            wait: this.config.waitforTimeout, // ms to wait for expectation to succeed
            interval: this.config.waitforInterval, // interval between attempts
        })

        const result = await new Promise((resolve) => {
            this.jrunner.env.beforeAll(this.wrapHook('beforeSuite'))
            this.jrunner.env.afterAll(this.wrapHook('afterSuite'))

            this.jrunner.onComplete(() => resolve(this.reporter.getFailedCount()))
            this.jrunner.execute()
        })
        await executeHooksWithArgs(this.config.after, [result, this.capabilities, this.specs])
        return result
    }

    customSpecFilter(spec) {
        const { grep, invertGrep } = this.jasmineNodeOpts
        const grepMatch = !grep || spec.getFullName().match(new RegExp(grep)) !== null
        if (grepMatch === Boolean(invertGrep)) {
            spec.pend('grep')
            return false
        }
        return true
    }

    /**
     * Hooks which are added as true Jasmine hooks need to call done() to notify async
     */
    wrapHook(hookName) {
        return (done) => executeHooksWithArgs(
            this.config[hookName],
            this.prepareMessage(hookName)
        ).then(() => done(), (e) => {
            log.info(`Error in ${hookName} hook: ${e.stack.slice(7)}`)
            done()
        })
    }

    prepareMessage(hookName) {
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

    formatMessage(params) {
        let message = {
            type: params.type
        }

        if (params.payload) {
            message.title = params.payload.description
            message.fullName = params.payload.fullName || null
            message.file = params.payload.file

            if (params.payload.failedExpectations && params.payload.failedExpectations.length) {
                message.errors = params.payload.failedExpectations
                message.error = params.payload.failedExpectations[0]
            }

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

    getExpectationResultHandler(jasmine) {
        let { expectationResultHandler } = this.jasmineNodeOpts
        const origHandler = jasmine.Spec.prototype.addExpectationResult

        if (typeof expectationResultHandler !== 'function') {
            return origHandler
        }

        return this.expectationResultHandler(origHandler)
    }

    expectationResultHandler(origHandler) {
        const { expectationResultHandler } = this.jasmineNodeOpts
        return function (passed, data) {
            try {
                expectationResultHandler.call(this, passed, data)
            } catch (e) {
                /**
                 * propagate expectationResultHandler error if actual assertion passed
                 * but the custom handler decides to throw
                 */
                if (passed) {
                    passed = false
                    data = {
                        passed: false,
                        message: 'expectationResultHandlerError: ' + e.message,
                        error: e
                    }
                }
            }

            return origHandler.call(this, passed, data)
        }
    }
}

const adapterFactory = {}
adapterFactory.init = async function (...args) {
    const adapter = new JasmineAdapter(...args)
    const instance = await adapter.init()
    return instance
}

export default adapterFactory
export { JasmineAdapter, adapterFactory }
