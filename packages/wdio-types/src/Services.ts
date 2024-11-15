/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Testrunner as TestrunnerOptions, WebdriverIO as WebdriverIOOptions } from './Options.js'
import type { RequestedStandaloneCapabilities, RequestedMultiremoteCapabilities, TestrunnerCapabilities, ResolvedTestrunnerCapabilities } from './Capabilities.js'
import type { Suite, Test, TestResult } from './Frameworks.js'
import type { Worker } from './Workers.js'

export interface RunnerInstance {
    initialize(): Promise<void>
    shutdown(): Promise<boolean>
    closeSession?: (cid: number) => Promise<void>
    getWorkerCount(): number
    run(args: any): Worker
    workerPool: any
    browserPool: any
}

export interface RunnerClass {
    new(
        options: WebdriverIO.BrowserRunnerOptions,
        config: Omit<WebdriverIOOptions, 'capabilities' | keyof Hooks>
    ): RunnerInstance
}

export interface RunnerPlugin extends RunnerClass {
    default: RunnerClass
    launcher?: RunnerClass
}

export interface ServiceOption {
    [key: string]: any
}

export interface ServiceClass {
    new(options: WebdriverIO.ServiceOption, capabilities: ResolvedTestrunnerCapabilities, config: WebdriverIOOptions): ServiceInstance
}

export interface ServicePlugin extends ServiceClass {
    default: ServiceClass
    launcher?: ServiceClass
}

export interface ServiceInstance extends HookFunctions {
    options?: Record<string, any>,
    capabilities?: WebdriverIO.Capabilities,
    config?: TestrunnerOptions
}

interface AssertionHookParams {
    /**
     * name of the matcher, e.g. `toHaveText` or `toBeClickable`
     */
    matcherName: string
    /**
     * Value that the user has passed in
     *
     * @example
     * ```
     * expect(el).toBeClickable() // expectedValue is undefined
     * expect(el).toHaveText('foo') // expectedValue is `'foo'`
     * expect(el).toHaveAttribute('attr', 'value', { ... }) // expectedValue is `['attr', 'value]`
     * ```
     */
    expectedValue?: any
    /**
     * Options that the user has passed in, e.g. `expect(el).toHaveText('foo', { ignoreCase: true })` -> `{ ignoreCase: true }`
     */
    options: object
}
interface AfterAssertionHookParams extends AssertionHookParams {
    result: {
        message: () => string
        result: boolean
    }
}

export type ServiceEntry = (
    /**
     * e.g. `services: ['@wdio/sauce-service']`
     */
    string |
    /**
     * e.g. `services: [{ onPrepare: () => { ... } }]`
     */
    HookFunctions |
    /**
     * e.g. `services: [CustomClass]`
     */
    ServiceClass |
    /**
     * e.g. `services: [['@wdio/sauce-service', { ... }]]`
     *
     * Note: we use `WebdriverIO.ServiceOptions` rather than referencing the
     * interface directly to allow other services to extend the service option
     * with theirs
     */
    [string, WebdriverIO.ServiceOption] |
    /**
     * e.g. `services: [[CustomClass, { ... }]]`
     *
     * Note: we use `WebdriverIO.ServiceOptions` rather than referencing the
     * interface directly to allow other services to extend the service option
     * with theirs
     */
    [ServiceClass, WebdriverIO.ServiceOption]
)

export type Hooks = {
    [k in keyof HookFunctions]: HookFunctions[k] | NonNullable<HookFunctions[k]>[];
}

export interface HookFunctions {
    /**
     * Gets executed once before all workers get launched.
     * @param config        wdio configuration object
     * @param capabilities  list of capabilities details
     */
    onPrepare?(
        config: TestrunnerOptions,
        capabilities: TestrunnerCapabilities
    ): unknown | Promise<unknown>

    /**
     * Gets executed after all workers got shut down and the process is about to exit. An error
     * thrown in the onComplete hook will result in the test run failing.
     * @param exitCode      runner exit code: 0 - success, 1 - fail
     * @param config        wdio configuration object
     * @param capabilities  list of capabilities details
     * @param results       test results
     */
    onComplete?(
        exitCode: number,
        config: Omit<TestrunnerOptions, 'capabilities'>,
        capabilities: TestrunnerCapabilities,
        results: any // Results
    ): unknown | Promise<unknown>

    /**
     * Gets executed before a worker process is spawned and can be used to initialize specific service
     * for that worker as well as modify runtime environments in an async fashion.
     * @param cid           capability id (e.g 0-0)
     * @param capabilities  object containing capabilities for session that will be spawn in the worker
     * @param specs         specs to be run in the worker process
     * @param args          object that will be merged with the main configuration once worker is initialized
     * @param execArgv      list of string arguments passed to the worker process
     */
    onWorkerStart?(
        cid: string,
        capabilities: WebdriverIO.Capabilities,
        specs: string[],
        args: TestrunnerOptions,
        execArgv: string[]
    ): unknown | Promise<unknown>

    /**
     * Gets executed just after a worker process has exited.
     * @param  {string} cid      capability id (e.g 0-0)
     * @param  {number} exitCode 0 - success, 1 - fail
     * @param  {object} specs    specs to be run in the worker process
     * @param  {number} retries  number of retries used
     */
    onWorkerEnd?(
        cid: string,
        exitCode: number,
        specs: string[],
        retries: number,
    ): unknown | Promise<unknown>

    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param capabilities  list of capabilities details
     * @param specs         specs to be run in the worker process
     * @param browser       instance of created browser/device session
     */
    before?(
        capabilities: RequestedStandaloneCapabilities | RequestedMultiremoteCapabilities,
        specs: string[],
        browser: any // BrowserObject
    ): unknown | Promise<unknown>

    /**
     * Gets executed after all tests are done. You still have access to all global variables from
     * the test.
     * @param result        number of total failing tests
     * @param capabilities  list of capabilities details
     * @param specs         list of spec file paths that are to be run
     */
    after?(
        result: number,
        capabilities: RequestedStandaloneCapabilities | RequestedMultiremoteCapabilities,
        specs: string[]
    ): unknown | Promise<unknown>

    /**
     * Gets executed just before initialising the webdriver session and test framework. It allows you
     * to manipulate configurations depending on the capability or spec.
     * @param config        wdio configuration object
     * @param capabilities  list of capabilities details
     * @param specs         list of spec file paths that are to be run
     * @param cid           worker id (e.g. 0-0)
     */
    beforeSession?(
        config: Omit<TestrunnerOptions, 'capabilities'>,
        capabilities: RequestedStandaloneCapabilities | RequestedMultiremoteCapabilities,
        specs: string[],
        cid: string
    ): unknown | Promise<unknown>

    /**
     * Gets executed right after terminating the webdriver session.
     * @param config        wdio configuration object
     * @param capabilities  list of capabilities details
     * @param specs         list of spec file paths that are to be run
     */
    afterSession?(
        config: TestrunnerOptions,
        capabilities: WebdriverIO.Capabilities,
        specs: string[]
    ): unknown | Promise<unknown>

    /**
     * Gets executed when a refresh happens.
     * @param oldSessionId session id of old session
     * @param newSessionId session id of new session
     */
    onReload?(
        oldSessionId: string,
        newSessionId: string
    ): unknown | Promise<unknown>

    /**
     * Hook that gets executed before the suite starts.
     * @param suite suite details
     */
    beforeSuite?(suite: Suite): unknown | Promise<unknown>

    /**
     * Hook that gets executed after the suite has ended
     * @param suite suite details
     */
    afterSuite?(suite: Suite): unknown | Promise<unknown>

    /**
     * Function to be executed before a test (in Mocha/Jasmine only)
     * @param {object} test    test object
     * @param {object} context scope object the test was executed with
     */
    beforeTest?(test: Test, context: any): unknown | Promise<unknown>

    /**
     * Function to be executed after a test (in Mocha/Jasmine only)
     * @param {object}  test             test object
     * @param {object}  context          scope object the test was executed with
     * @param {Error}   result.error     error object in case the test fails, otherwise `undefined`
     * @param {*}       result.result    return object of test function
     * @param {number}  result.duration  duration of test
     * @param {boolean} result.passed    true if test has passed, otherwise false
     * @param {object}  result.retries   information about spec related retries, e.g. `{ attempts: 0, limit: 0 }`
     */
    afterTest?(test: Test, context: any, result: TestResult): unknown | Promise<unknown>

    /**
     * Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
     * beforeEach in Mocha). `stepData` and `world` are Cucumber framework specific properties.
     * @param test      details to current running test (represents step in Cucumber)
     * @param context   context to current running test (represents World object in Cucumber)
     * @param hookName  name of the hook
    */
    beforeHook?(test: any, context: any, hookName: string): unknown | Promise<unknown>

    /**
     * Hook that gets executed _after_ a hook within the suite ends (e.g. runs after calling
     * afterEach in Mocha). `stepData` and `world` are Cucumber framework specific.
     * @param test      details to current running test (represents step in Cucumber)
     * @param context   context to current running test (represents World object in Cucumber)
     * @param result    test result
     * @param hookName  name of the hook
    */
    afterHook?(test: Test, context: any, result: TestResult, hookName: string): unknown | Promise<unknown>

    /**
     * Runs before a WebdriverIO command gets executed.
     * @param commandName command name
     * @param args        arguments that command would receive
     */
    beforeCommand?(
        commandName: string,
        args: any[]
    ): unknown | Promise<unknown>

    /**
     * Runs after a WebdriverIO command gets executed
     * @param commandName  command name
     * @param args         arguments that command would receive
     * @param result       result of the command
     * @param error        error in case something went wrong
     */
    afterCommand?(
        commandName: string,
        args: any[],
        result: any,
        error?: Error
    ): unknown | Promise<unknown>

    /**
     * Runs before a WebdriverIO assertion library makes an assertion.
     * @param commandName command name
     * @param args        arguments that command would receive
     */
    beforeAssertion?(params: AssertionHookParams): unknown | Promise<unknown>

    /**
     * Runs after a WebdriverIO command gets executed
     * @param commandName  command name
     * @param args         arguments that command would receive
     * @param result       result of the command
     * @param error        error in case something went wrong
     */
    afterAssertion?(params: AfterAssertionHookParams): unknown | Promise<unknown>
}
