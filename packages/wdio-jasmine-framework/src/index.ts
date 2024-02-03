import url from 'node:url'
import type { EventEmitter } from 'node:events'

import Jasmine from 'jasmine'
import logger from '@wdio/logger'
import { wrapGlobalTestMethod, executeHooksWithArgs } from '@wdio/utils'
import { expect as expectImport, matchers, getConfig } from 'expect-webdriverio'
import { _setGlobal } from '@wdio/globals'
import type { Options, Services, Capabilities } from '@wdio/types'

import JasmineReporter from './reporter.js'
import { jestResultToJasmine } from './utils.js'
import type {
    JasmineOpts as jasmineNodeOpts, ResultHandlerPayload, FrameworkMessage, FormattedMessage
} from './types.js'

const INTERFACES = {
    bdd: ['beforeAll', 'beforeEach', 'it', 'xit', 'fit', 'afterEach', 'afterAll']
}

const EXPECT_ASYMMETRIC_MATCHERS = [
    'any',
    'anything',
    'arrayContaining',
    'objectContaining',
    'stringContaining',
    'stringMatching',
    'not',
] as const
const TEST_INTERFACES = ['it', 'fit', 'xit']
const NOOP = function noop() { }
const DEFAULT_TIMEOUT_INTERVAL = 60000
const FILE_PROTOCOL = 'file://'

const log = logger('@wdio/jasmine-framework')

type HooksArray = {
    [K in keyof Required<Services.HookFunctions>]: Required<Services.HookFunctions>[K][]
}

interface WebdriverIOJasmineConfig extends Omit<Options.Testrunner, keyof HooksArray>, HooksArray {
    jasmineOpts: Omit<jasmineNodeOpts, 'cleanStack'>
}

/**
 * Jasmine runner
 */
class JasmineAdapter {
    private _jasmineOpts: jasmineNodeOpts
    private _reporter: JasmineReporter
    private _totalTests = 0
    private _hasTests = true
    private _lastTest?: any
    private _lastSpec?: any

    private _jrunner = new Jasmine({})

    constructor(
        private _cid: string,
        private _config: WebdriverIOJasmineConfig,
        private _specs: string[],
        private _capabilities: Capabilities.RemoteCapabilities,
        reporter: EventEmitter
    ) {
        this._jasmineOpts = Object.assign({
            cleanStack: true
        }, (
            this._config.jasmineOpts ||
            // @ts-expect-error legacy option
            this._config.jasmineNodeOpts
        ))

        this._reporter = new JasmineReporter(reporter, {
            cid: this._cid,
            specs: this._specs,
            cleanStack: this._jasmineOpts.cleanStack,
            jasmineOpts: this._jasmineOpts
        })
        this._hasTests = true
        this._jrunner.exitOnCompletion = false
    }

    async init() {
        const self = this

        const { jasmine } = this._jrunner
        // @ts-ignore outdated
        const jasmineEnv = jasmine.getEnv()
        this._specs.forEach((spec) => this._jrunner.addSpecFile(
            /**
             * as Jasmine doesn't support file:// formats yet we have to
             * remove it before adding it to Jasmine
             */
            spec.startsWith(FILE_PROTOCOL)
                ? url.fileURLToPath(spec)
                : spec
        ))

        // @ts-ignore only way to hack timeout into jasmine
        jasmine.DEFAULT_TIMEOUT_INTERVAL = this._jasmineOpts.defaultTimeoutInterval || DEFAULT_TIMEOUT_INTERVAL
        jasmineEnv.addReporter(this._reporter)

        /**
         * Filter specs to run based on jasmineOpts.grep and jasmineOpts.invert
         */
        jasmineEnv.configure({
            specFilter: this._jasmineOpts.specFilter || this.customSpecFilter.bind(this),
            stopOnSpecFailure: Boolean(this._jasmineOpts.stopOnSpecFailure),
            failSpecWithNoExpectations: Boolean(this._jasmineOpts.failSpecWithNoExpectations),
            failFast: this._jasmineOpts.failFast,
            random: Boolean(this._jasmineOpts.random),
            seed: Boolean(this._jasmineOpts.seed),
            oneFailurePerSpec: Boolean(
                // depcrecated old property
                this._jasmineOpts.stopSpecOnExpectationFailure ||
                this._jasmineOpts.oneFailurePerSpec
            )
        })

        /**
         * enable expectHandler
         */
        jasmine.Spec.prototype.addExpectationResult = this.getExpectationResultHandler(jasmine)

        const hookArgsFn = (context: unknown): [unknown, unknown] => [{ ...(self._lastTest || {}) }, context]

        const emitHookEvent = (
            fnName: string,
            eventType: string,
        ) => (
            _test: never,
            _context: never,
            { error }: { error?: jasmine.FailedExpectation } = {},
        ) => {
            const title = `"${fnName === 'beforeAll' ? 'before' : 'after'} all" hook`
            const hook = {
                id: '',
                start: new Date(),
                type: 'hook' as const,
                description: title,
                fullName: title,
                duration: null,
                properties: {},
                passedExpectations: [],
                pendingReason: '',
                failedExpectations: [],
                deprecationWarnings: [],
                status: '',
                debugLogs: null,
                ...(error ? { error } : {})
            }

            this._reporter.emit('hook:' + eventType, hook)
        }

        /**
         * wrap commands
         */
        INTERFACES.bdd.forEach((fnName) => {
            const isTest = TEST_INTERFACES.includes(fnName)
            const beforeHook = [...this._config.beforeHook] as ((test: any, context: any) => void)[]
            const afterHook = [...this._config.afterHook]

            /**
             * add beforeAll and afterAll hooks to reporter
             */
            if (fnName.includes('All')) {
                beforeHook.push(emitHookEvent(fnName, 'start'))
                afterHook.push(emitHookEvent(fnName, 'end'))
            }

            wrapGlobalTestMethod(
                isTest,
                isTest ? this._config.beforeTest : beforeHook,
                hookArgsFn,
                isTest ? this._config.afterTest : afterHook,
                hookArgsFn,
                fnName,
                this._cid
            )
        })

        /**
         * for a clean stdout we need to avoid that Jasmine initializes the
         * default reporter
         */
        Jasmine.prototype.configureDefaultReporter = NOOP

        /**
         * wrap Suite and Spec prototypes to get access to their data
         */
        // @ts-ignore
        const beforeAllMock = jasmine.Suite.prototype.beforeAll
        // @ts-ignore
        jasmine.Suite.prototype.beforeAll = function (...args) {
            self._lastSpec = this.result
            beforeAllMock.apply(this, args)
        }
        const executeMock = jasmine.Spec.prototype.execute
        jasmine.Spec.prototype.execute = function (...args: any[]) {
            self._lastTest = this.result
            // @ts-ignore overwrite existing type
            self._lastTest.start = new Date().getTime()
            globalThis._wdioDynamicJasmineResultErrorList = this.result.failedExpectations
            globalThis._jasmineTestResult = this.result
            executeMock.apply(this, args)
        }

        /**
         * set up WebdriverIO matchers with Jasmine
         */
        const expect = jasmineEnv.expectAsync
        const matchers = this.#setupMatchers(jasmine)
        jasmineEnv.beforeAll(() => jasmineEnv.addAsyncMatchers(matchers))

        /**
         * make Jasmine and WebdriverIOs expect global more compatible by attaching
         * support asymmetric matchers to the `expect` global
         */
        const wdioExpect = expectImport as ExpectWebdriverIO.Expect
        for (const matcher of EXPECT_ASYMMETRIC_MATCHERS) {
            expect[matcher] = wdioExpect[matcher]
        }
        expect.not = wdioExpect.not

        _setGlobal('expect', expect, this._config.injectGlobals)

        /**
         * load environment
         */
        await this._loadFiles()

        /**
         * overwrite Jasmine global expect with WebdriverIOs expect
         */
        _setGlobal('expect', expect, this._config.injectGlobals)

        return this
    }

    async _loadFiles() {
        try {
            if (Array.isArray(this._jasmineOpts.requires)) {
                // @ts-ignore outdated types
                this._jrunner.addRequires(this._jasmineOpts.requires)
            }
            if (Array.isArray(this._jasmineOpts.helpers)) {
                this._jrunner.addMatchingHelperFiles(this._jasmineOpts.helpers)
            }
            // @ts-ignore outdated types
            await this._jrunner.loadRequires()
            await this._jrunner.loadHelpers()
            await this._jrunner.loadSpecs()
            // @ts-ignore outdated types
            this._grep(this._jrunner.env.topSuite())
            this._hasTests = this._totalTests > 0
        } catch (err: any) {
            log.warn(
                'Unable to load spec files quite likely because they rely on `browser` object that is not fully initialized.\n' +
                '`browser` object has only `capabilities` and some flags like `isMobile`.\n' +
                'Helper files that use other `browser` commands have to be moved to `before` hook.\n' +
                `Spec file(s): ${this._specs.join(',')}\n`,
                'Error: ', err
            )
        }
    }

    _grep (suite: jasmine.Suite) {
        // @ts-ignore outdated types
        suite.children.forEach((child) => {
            if (Array.isArray((child as jasmine.Suite).children)) {
                return this._grep(child as jasmine.Suite)
            }
            if (this.customSpecFilter(child)) {
                this._totalTests++
            }
        })
    }

    hasTests() {
        return this._hasTests
    }

    async run() {
        // @ts-expect-error
        this._jrunner.env.beforeAll(this.wrapHook('beforeSuite'))
        // @ts-expect-error
        this._jrunner.env.afterAll(this.wrapHook('afterSuite'))

        await this._jrunner.execute()

        const result = this._reporter.getFailedCount()
        await executeHooksWithArgs('after', this._config.after, [result, this._capabilities, this._specs])
        return result
    }

    customSpecFilter (spec: jasmine.Spec) {
        const { grep, invertGrep } = this._jasmineOpts
        const grepMatch = !grep || spec.getFullName().match(new RegExp(grep)) !== null

        if (grepMatch === Boolean(invertGrep)) {
            // @ts-expect-error internal method
            if (typeof spec.pend === 'function') {
                // @ts-expect-error internal method
                spec.pend('grep')
            }
            return false
        }
        return true
    }

    /**
     * Hooks which are added as true Jasmine hooks need to call done() to notify async
     */
    wrapHook (hookName: keyof Services.HookFunctions) {
        return () => executeHooksWithArgs(
            hookName,
            this._config[hookName],
            [this.prepareMessage(hookName)]
        ).catch((e: Error) => {
            log.info(`Error in ${hookName} hook: ${e.stack?.slice(7)}`)
        })
    }

    prepareMessage (hookName: keyof Services.HookFunctions) {
        const params: FrameworkMessage = { type: hookName }

        switch (hookName) {
        case 'beforeSuite':
        case 'afterSuite':
            params.payload = Object.assign({
                file: this._jrunner?.specFiles[0]
            }, this._lastSpec)
            break
        case 'beforeTest':
        case 'afterTest':
            params.payload = Object.assign({
                file: this._jrunner?.specFiles[0]
            }, this._lastTest)
            break
        }

        return this.formatMessage(params)
    }

    formatMessage (params: FrameworkMessage) {
        const message: FormattedMessage = {
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
                message.parent = this._lastSpec?.description
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

    getExpectationResultHandler (jasmine: jasmine.Jasmine) {
        const { expectationResultHandler } = this._jasmineOpts
        const origHandler = jasmine.Spec.prototype.addExpectationResult

        if (typeof expectationResultHandler !== 'function') {
            return origHandler
        }

        return this.expectationResultHandler(origHandler)
    }

    expectationResultHandler (origHandler: Function) {
        const { expectationResultHandler } = this._jasmineOpts
        return function (this: jasmine.Spec, passed: boolean, data: ResultHandlerPayload) {
            try {
                expectationResultHandler!.call(this, passed, data)
            } catch (e: any) {
                /**
                 * propagate expectationResultHandler error if actual assertion passed
                 * but the custom handler decides to throw
                 */
                if (passed) {
                    passed = false
                    data = {
                        passed,
                        message: 'expectationResultHandlerError: ' + e.message,
                        error: e
                    }
                }
            }

            return origHandler.call(this, passed, data)
        }
    }

    #transformMatchers (matchers: jasmine.CustomMatcherFactories) {
        return Object.entries(matchers).reduce((prev, [name, fn]) => {
            prev[name] = (util) => ({
                compare: async <T>(actual: T, expected: T, ...args: any[]) => fn(util).compare(actual, expected, ...args),
                negativeCompare: async <T>(actual: T, expected: T, ...args: unknown[]) => {
                    const { pass, message } = fn(util).compare(actual, expected, ...args)
                    return {
                        pass: !pass,
                        message
                    }
                }
            })
            return prev
        }, {} as jasmine.CustomAsyncMatcherFactories)
    }

    #setupMatchers (jasmine: jasmine.Jasmine): jasmine.CustomAsyncMatcherFactories {
        /**
         * overwrite "jasmine.addMatchers" to be always async since the `expect` global we
         * have is the `expectAsync` from Jasmine, so we need to ensure that synchronous
         * matchers are added to `expectAsync`
         */
        globalThis.jasmine.addMatchers = (matchers) => globalThis.jasmine.addAsyncMatchers(this.#transformMatchers(matchers))

        // @ts-expect-error not exported in jasmine
        const syncMatchers: jasmine.CustomAsyncMatcherFactories = this.#transformMatchers(jasmine.matchers)
        const wdioMatchers: jasmine.CustomAsyncMatcherFactories = Object.entries(matchers as Record<string, any>).reduce((prev, [name, fn]) => {
            prev[name] = () => ({
                async compare (...args: unknown[]) {
                    const context = getConfig()
                    const result = fn.apply({ ...context, isNot: false }, args)
                    return jestResultToJasmine(result, false)
                },
                async negativeCompare (...args: unknown[]) {
                    const context = getConfig()
                    const result = fn.apply({ ...context, isNot: true }, args)
                    return jestResultToJasmine(result, true)
                }
            })
            return prev
        }, {} as jasmine.CustomAsyncMatcherFactories)
        return { ...wdioMatchers, ...syncMatchers }
    }
}

const adapterFactory: { init?: Function } = {}
adapterFactory.init = async function (...args: any[]) {
    // @ts-ignore pass along parameters
    const adapter = new JasmineAdapter(...args)
    const instance = await adapter.init()
    return instance
}

export default adapterFactory
export { JasmineAdapter, adapterFactory }
export * from './types.js'

type jasmine = typeof Jasmine
declare global {
    /**
     * Define a single spec. A spec should contain one or more expectations that test the state of the code.
     * A spec whose expectations all succeed will be passing and a spec with any failures will fail.
     * @param expectation Textual description of what this spec is checking
     * @param assertion Function that contains the code of your test. If not provided the test will be pending.
     * @param timeout Custom timeout for an async spec.
     * @param retries Custom retry count for this single spec (WebdriverIO specific)
     */
    function it(expectation: string, assertion?: jasmine.ImplementationCallback, timeout?: number, retries?: number): void;

    /**
     * A focused `it`. If suites or specs are focused, only those that are focused will be executed.
     * @param expectation Textual description of what this spec is checking
     * @param assertion Function that contains the code of your test. If not provided the test will be pending.
     * @param timeout Custom timeout for an async spec.
     * @param retries Custom retry count for this single spec (WebdriverIO specific)
     */
    function fit(expectation: string, assertion?: jasmine.ImplementationCallback, timeout?: number, retries?: number): void;

    /**
     * A temporarily disabled `it`. The spec will report as pending and will not be executed.
     * @param expectation Textual description of what this spec is checking
     * @param assertion Function that contains the code of your test. If not provided the test will be pending.
     * @param timeout Custom timeout for an async spec.
     * @param retries Custom retry count for this single spec (WebdriverIO specific)
     */
    function xit(expectation: string, assertion?: jasmine.ImplementationCallback, timeout?: number, retries?: number): void;

    /**
     * Run some shared setup before each of the specs in the describe in which it is called.
     * @param action Function that contains the code to setup your specs.
     * @param timeout Custom timeout for an async beforeEach.
     * @param retries Custom retry count for this single hook (WebdriverIO specific)
     */
    function beforeEach(action: jasmine.ImplementationCallback, timeout?: number, retries?: number): void;

    /**
     * Run some shared teardown after each of the specs in the describe in which it is called.
     * @param action Function that contains the code to teardown your specs.
     * @param timeout Custom timeout for an async afterEach.
     * @param retries Custom retry count for this single hook (WebdriverIO specific)
     */
    function afterEach(action: jasmine.ImplementationCallback, timeout?: number, retries?: number): void;

    /**
     * Run some shared setup once before all of the specs in the describe are run.
     * Note: Be careful, sharing the setup from a beforeAll makes it easy to accidentally leak state between your specs so that they erroneously pass or fail.
     * @param action Function that contains the code to setup your specs.
     * @param timeout Custom timeout for an async beforeAll.
     * @param retries Custom retry count for this single hook (WebdriverIO specific)
     */
    function beforeAll(action: jasmine.ImplementationCallback, timeout?: number, retries?: number): void;

    /**
     * Run some shared teardown once before all of the specs in the describe are run.
     * Note: Be careful, sharing the teardown from a afterAll makes it easy to accidentally leak state between your specs so that they erroneously pass or fail.
     * @param action Function that contains the code to teardown your specs.
     * @param timeout Custom timeout for an async afterAll
     * @param retries Custom retry count for this single hook (WebdriverIO specific)
     */
    function afterAll(action: jasmine.ImplementationCallback, timeout?: number, retries?: number): void;

    namespace WebdriverIO {
        interface JasmineOpts extends jasmineNodeOpts {}
    }
    namespace ExpectWebdriverIO {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Matchers<R, T> extends jasmine.Matchers<R> {}
    }
}
