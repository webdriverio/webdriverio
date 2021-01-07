import { MultiRemoteCapabilities, Config, /* BrowserObject */ } from 'webdriverio'
import type { Capabilities } from '@wdio/types'

export type Hooks = {
    [k in keyof HookFunctions]: HookFunctions[k] | NonNullable<HookFunctions[k]>[];
}

export type Capability = Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities | MultiRemoteCapabilities;

export interface ConfigOptions extends Omit<Config, 'capabilities' | keyof Hooks>, Hooks {
    automationProtocol?: 'webdriver' | 'devtools' | './protocol-stub'
    /**
     * specs defined as CLI argument
     */
    spec?: string[]
    /**
     * specs defined within the config file
     */
    specs?: string[]
    exclude?: string[]
    suite?: string[]
    suites?: Record<string, string[]>
    capabilities?: Capabilities.RemoteCapabilities
    specFileRetryAttempts?: number
    cucumberFeaturesWithLineNumbers?: string[]
    specFileRetriesDeferred?: boolean
    specFileRetries?: number
    maxInstances?: number
    watch?: boolean
}

export interface HookFunctions {
    /**
     * Gets executed once before all workers get launched.
     * @param config        wdio configuration object
     * @param capabilities  list of capabilities details
     */
    onPrepare?(
        config: Config,
        capabilities: Capabilities.DesiredCapabilities[]
    ): void;

    /**
     * Gets executed before a worker process is spawned and can be used to initialise specific service
     * for that worker as well as modify runtime environments in an async fashion.
     * @param cid       capability id (e.g 0-0)
     * @param caps      object containing capabilities for session that will be spawn in the worker
     * @param specs     specs to be run in the worker process
     * @param args      object that will be merged with the main configuration once worker is initialised
     * @param execArgv  list of string arguments passed to the worker process
     */
    onWorkerStart?(
        cid: string,
        caps: Capabilities.DesiredCapabilities,
        specs: string[],
        args: Config,
        execArgv: string[]
    ): void;

    /**
     * Gets executed after all workers got shut down and the process is about to exit. An error
     * thrown in the onComplete hook will result in the test run failing.
     * @param exitCode      runner exit code
     * @param config        wdio configuration object
     * @param capabilities  list of capabilities details
     * @param results       test results
     */
    onComplete?(
        exitCode: number,
        config: Config,
        capabilities: Capabilities.DesiredCapabilities,
        results: any // Results
    ): void;

    /**
     * Gets executed when a refresh happens.
     * @param oldSessionId session id of old session
     * @param newSessionId session id of new session
     */
    onReload?(
        oldSessionId: string,
        newSessionId: string
    ): void;

    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param capabilities  list of capabilities details
     * @param specs         specs to be run in the worker process
     * @param browser       instance of created browser/device session
     */
    before?(
        capabilities: Capabilities.DesiredCapabilities,
        specs: string[],
        browser: any // BrowserObject
    ): void;

    /**
     * Runs before a WebdriverIO command gets executed.
     * @param commandName command name
     * @param args        arguments that command would receive
     */
    beforeCommand?(
        commandName: string,
        args: any[]
    ): void;

    /**
     * Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
     * beforeEach in Mocha). `stepData` and `world` are Cucumber framework specific properties.
     * @param test      details to current running test (or step in Cucumber)
     * @param context   context to current running test
     * @param stepData  Cucumber step data
     * @param world     Cucumber world
     */
    beforeHook?(test: any, context: any, stepData?: any, world?: any): void;

    /**
     * Gets executed just before initialising the webdriver session and test framework. It allows you
     * to manipulate configurations depending on the capability or spec.
     * @param config        wdio configuration object
     * @param capabilities  list of capabilities details
     * @param specs         list of spec file paths that are to be run
     */
    beforeSession?(
        config: Config,
        capabilities: Capabilities.DesiredCapabilities,
        specs: string[]
    ): void;

    /**
     * Hook that gets executed before the suite starts.
     * @param suite suite details
     */
    beforeSuite?(suite: any /* Suite */): void;

    /**
     * Function to be executed before a test (in Mocha/Jasmine) starts.
     * @param test      details to current running test (or step in Cucumber)
     * @param context   context to current running test
     */
    beforeTest?(test: any /* Test */, context: any): void;

    /**
     * Hook that gets executed _after_ a hook within the suite ends (e.g. runs after calling
     * afterEach in Mocha). `stepData` and `world` are Cucumber framework specific.
     * @param test      details to current running test (or step in Cucumber)
     * @param context   context to current running test
     * @param result    test result
     * @param stepData  Cucumber step data
     * @param world     Cucumber world
     */
    afterHook?(test: any, context: any, result: any /* TestResult */, stepData?: any, world?: any): void;

    /**
     * Gets executed after all tests are done. You still have access to all global variables from
     * the test.
     * @param result        number of total failing tests
     * @param capabilities  list of capabilities details
     * @param specs         list of spec file paths that are to be run
     */
    after?(
        result: number,
        capabilities: Capabilities.DesiredCapabilities,
        specs: string[]
    ): void;

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
    ): void;

    /**
     * Gets executed right after terminating the webdriver session.
     * @param config        wdio configuration object
     * @param capabilities  list of capabilities details
     * @param specs         list of spec file paths that are to be run
     */
    afterSession?(
        config: Config,
        capabilities: Capabilities.DesiredCapabilities,
        specs: string[]
    ): void;

    /**
     * Hook that gets executed after the suite has ended
     * @param suite suite details
     */
    afterSuite?(suite: any /* Suite */): void;

    /**
     * Function to be executed after a test (in Mocha/Jasmine) ends.
     * @param test      details to current running test (or step in Cucumber)
     * @param context   context to current running test
     * @param result    test result
     */
    afterTest?(test: any /* Test */, context: any, result: any /* TestResult */): void;
}

export interface SingleConfigOption extends Omit<ConfigOptions, 'capabilities'> {
    capabilities: Capability
}

export type DefaultOptions<T> = {
    [k in keyof T]?: {
        type: 'string' | 'number' | 'object' | 'boolean' | 'function'
        default?: T[k]
        required?: boolean
        validate?: (option: T[k]) => void
        match?: RegExp
    }
}
