/// <reference types="node"/>
/// <reference types="webdriver"/>

// See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/24419
interface Element { }
interface Node { }
interface NodeListOf<TNode = Node> { }

declare namespace WebdriverIO {
    type LocationParam = 'x' | 'y';

    interface LocationReturn {
        x: number,
        y: number
    }

    type SizeParam = 'width' | 'height';

    interface SizeReturn {
        width: number,
        height: number
    }

    interface CSSProperty {
        property: string;
        value: any;
        parsed?: {
            // other
            unit?: string;
            // font-family
            value?: any;
            string: string;
            // color
            hex?: string;
            alpha?: number;
            type?: string;
            rgba?: string
        }
    }

    type JsonPrimitive = string | number | boolean | null;
    type JsonObject = { [x: string]: JsonPrimitive | JsonObject | JsonArray };
    type JsonArray = Array<JsonPrimitive | JsonObject | JsonArray>;
    type JsonCompatible = JsonObject | JsonArray;

    interface MultiRemoteBrowserOptions {
        capabilities: WebDriver.DesiredCapabilities;
    }

    interface MultiRemoteCapabilities {
        [instanceName: string]: MultiRemoteBrowserOptions;
    }


    interface ServiceOption {
        [key: string]: any;
    }

    interface RunnerInstance {
        initialise(): Promise<void>
        shutdown(): Promise<void>
        getWorkerCount(): number
        run(args: any): NodeJS.EventEmitter
        workerPool: any
    }

    interface ServiceClass {
        new(options: ServiceOption, caps: WebDriver.DesiredCapabilities, config: Options): ServiceInstance
    }

    interface RunnerClass {
        new(configFile: string, config: Omit<WebdriverIO.Config, 'capabilities' | keyof WebdriverIO.Hooks>): RunnerInstance
    }

    interface ServicePlugin extends ServiceClass {
        default: ServiceClass
        launcher?: ServiceClass
    }

    interface RunnerPlugin extends RunnerClass {
        default: RunnerClass
        launcher?: RunnerClass
    }

    interface ServiceInstance extends HookFunctions {
        options?: Record<string, any>,
        capabilities?: WebDriver.DesiredCapabilities,
        config?: Config
    }

    type ServiceEntry = (
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
         */
        [string, ServiceOption] |
        /**
         * e.g. `services: [[CustomClass, { ... }]]`
         */
        [ServiceClass, ServiceOption]
    )

    interface Options {
        /**
         * Define the protocol you want to use for your browser automation.
         * Currently only [`webdriver`](https://www.npmjs.com/package/webdriver) and
         * [`devtools`](https://www.npmjs.com/package/devtools) are supported,
         * as these are the main browser automation technologies available.
         */
        automationProtocol?: string;
        runner?: string;
        /**
         * Your cloud service username (only works for Sauce Labs, Browserstack, TestingBot,
         * CrossBrowserTesting or LambdaTest accounts). If set, WebdriverIO will automatically
         * set connection options for you.
         */
        user?: string;
        /**
         * Your cloud service access key or secret key (only works for Sauce Labs, Browserstack,
         * TestingBot, CrossBrowserTesting or LambdaTest accounts). If set, WebdriverIO will
         * automatically set connection options for you.
         */
        key?: string;
        /**
         * If running on Sauce Labs, you can choose to run tests between different datacenters:
         * US or EU. To change your region to EU, add region: 'eu' to your config.
         */
        region?: string;
        /**
         * Sauce Labs provides a headless offering that allows you to run Chrome and Firefox tests headless.
         */
        headless?: boolean;
        /**
         * Define specs for test execution.
         */
        specs?: string[];
        /**
         * Exclude specs from test execution.
         */
        exclude?: string[];
        /**
         * Files to watch when running `wdio` with the `--watch` flag.
         */
        filesToWatch?: string[],
        /**
         * An object describing various of suites, which you can then specify
         * with the --suite option on the wdio CLI.
         */
        suites?: Record<string, string[]>;
        /**
         * Maximum number of total parallel running workers.
         */
        maxInstances?: number;
        /**
         * Maximum number of total parallel running workers per capability.
         */
        maxInstancesPerCapability?: number;
        capabilities?: WebDriver.DesiredCapabilities[] | MultiRemoteCapabilities;
        /**
         * Directory to store all testrunner log files (including reporter logs and wdio logs).
         * If not set, all logs are streamed to stdout. Since most reporters are made to log to
         * stdout, it is recommended to only use this option for specific reporters where it
         * makes more sense to push report into a file (like the junit reporter, for example).
         *
         * When running in standalone mode, the only log generated by WebdriverIO will be the wdio log.
         */
        outputDir?: string;
        /**
         * Shorten url command calls by setting a base URL.
         */
        baseUrl?: string;
        /**
         * If you want your test run to stop after a specific number of test failures, use bail.
         * (It defaults to 0, which runs all tests no matter what.) Note: Please be aware that
         * when using a third party test runner (such as Mocha), additional configuration might
         * be required.
         */
        bail?: number;
        /**
         * The number of retry attempts for an entire specfile when it fails as a whole.
         */
        specFileRetries?: number;
        /**
         * Delay in seconds between the spec file retry attempts
         */
        specFileRetriesDelay?: number;
        /**
         * Default timeout for all `waitFor*` commands. (Note the lowercase f in the option name.)
         * This timeout only affects commands starting with `waitFor*` and their default wait time.
         */
        waitforTimeout?: number;
        /**
         * Default interval for all `waitFor*` commands to check if an expected state (e.g.,
         * visibility) has been changed.
         */
        waitforInterval?: number;
        /**
         * Defines the test framework to be used by the WDIO testrunner.
         */
        framework?: string;
        /**
         * List of reporters to use. A reporter can be either a string, or an array of
         * `['reporterName', { <reporter options> }]` where the first element is a string
         * with the reporter name and the second element an object with reporter options.
         */
        reporters?: (string | object)[];
        /**
         * Determines in which interval the reporter should check if they are synchronised
         * if they report their logs asynchronously (e.g. if logs are streamed to a 3rd
         * party vendor).
         */
        reporterSyncInterval?: number;
        /**
         * Determines the maximum time reporters have to finish uploading all their logs
         * until an error is being thrown by the testrunner.
         */
        reporterSyncTimeout?: number;
        /**
         * Services take over a specific job you don't want to take care of. They enhance
         * your test setup with almost no effort.
         */
        services?: ServiceEntry[];
        /**
         * Node arguments to specify when launching child processes.
         */
        execArgv?: string[];
    }

    interface RemoteOptions extends WebDriver.Options, HookFunctions, Omit<Options, 'capabilities'> { }

    interface MultiRemoteOptions {
        [instanceName: string]: WebDriver.DesiredCapabilities;
    }

    interface Suite {
        error?: any;
    }
    interface Test {}
    interface TestResult {
        error?: any,
        result?: any,
        passed: boolean,
        duration: number,
        retries: { limit: number, attempts: number }
    }

    interface Results {
        finished: number,
        passed: number,
        failed: number
    }

    interface HookFunctions {
        /**
         * Gets executed once before all workers get launched.
         * @param config        wdio configuration object
         * @param capabilities  list of capabilities details
         */
        onPrepare?(
            config: Config,
            capabilities: WebDriver.DesiredCapabilities[]
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
            caps: WebDriver.DesiredCapabilities,
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
            capabilities: WebDriver.DesiredCapabilities,
            results: Results
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
            capabilities: WebDriver.DesiredCapabilities,
            specs: string[],
            browser: BrowserObject
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
            capabilities: WebDriver.DesiredCapabilities,
            specs: string[]
        ): void;

        /**
         * Hook that gets executed before the suite starts.
         * @param suite suite details
         */
        beforeSuite?(suite: Suite): void;

        /**
         * Function to be executed before a test (in Mocha/Jasmine) starts.
         * @param test      details to current running test (or step in Cucumber)
         * @param context   context to current running test
         */
        beforeTest?(test: Test, context: any): void;

        /**
         * Hook that gets executed _after_ a hook within the suite ends (e.g. runs after calling
         * afterEach in Mocha). `stepData` and `world` are Cucumber framework specific.
         * @param test      details to current running test (or step in Cucumber)
         * @param context   context to current running test
         * @param result    test result
         * @param stepData  Cucumber step data
         * @param world     Cucumber world
         */
        afterHook?(test: any, context: any, result: TestResult, stepData?: any, world?: any): void;

        /**
         * Gets executed after all tests are done. You still have access to all global variables from
         * the test.
         * @param result        number of total failing tests
         * @param capabilities  list of capabilities details
         * @param specs         list of spec file paths that are to be run
         */
        after?(
            result: number,
            capabilities: WebDriver.DesiredCapabilities,
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
            capabilities: WebDriver.DesiredCapabilities,
            specs: string[]
        ): void;

        /**
         * Hook that gets executed after the suite has ended
         * @param suite suite details
         */
        afterSuite?(suite: Suite): void;

        /**
         * Function to be executed after a test (in Mocha/Jasmine) ends.
         * @param test      details to current running test (or step in Cucumber)
         * @param context   context to current running test
         * @param result    test result
         */
        afterTest?(test: Test, context: any, result: TestResult): void;
    }
    type _HooksArray = {
        [K in keyof Pick<HookFunctions, "onPrepare" | "onWorkerStart" | "onComplete" | "before" | "after" | "beforeSession" | "afterSession">]: HookFunctions[K] | Array<HookFunctions[K]>;
    };
    type _Hooks = Omit<HookFunctions, "onPrepare" | "onWorkerStart" | "onComplete" | "before" | "after" | "beforeSession" | "afterSession">;
    interface Hooks extends _HooksArray, _Hooks { }

    type ActionTypes = 'press' | 'longPress' | 'tap' | 'moveTo' | 'wait' | 'release';
    interface TouchAction {
        action: ActionTypes,
        x?: number,
        y?: number,
        element?: Element,
        ms?: number
    }
    type TouchActionParameter = string | string[] | TouchAction | TouchAction[];
    type TouchActions = TouchActionParameter | TouchActionParameter[];

    type WaitForOptions = {
        timeout?: number,
        interval?: number,
        timeoutMsg?: string,
        reverse?: boolean,
    }

    type Matcher = {
        name: string,
        args: Array<string | object>
        class?: string
    }

    type ReactSelectorOptions = {
        props?: object,
        state?: any[] | number | string | object | boolean
    }

    type MoveToOptions = {
        xOffset?: number,
        yOffset?: number
    }

    type DragAndDropOptions = {
        duration?: number
    }

    type NewWindowOptions = {
        windowName?: string,
        windowFeatures?: string
    }

    type PDFPrintOptions = {
        orientation?: string,
        scale?: number,
        background?: boolean,
        width?: number,
        height?: number,
        top?: number,
        bottom?: number,
        left?: number,
        right?: number,
        shrinkToFit?: boolean,
        pageRanges?: object[]
    }

    type ClickOptions = {
        button?: number | string,
        x?: number,
        y?: number
    }

    type WaitUntilOptions = {
        timeout?: number,
        timeoutMsg?: string,
        interval?: number
    }

    type DragAndDropCoordinate = {
        x: number,
        y: number
    }

    /**
     * HTTP request data. (copied from the puppeteer-core package as there is currently
     * no way to access these types otherwise)
     */
    type ResourcePriority = 'VeryLow' | 'Low' | 'Medium' | 'High' | 'VeryHigh';
    type MixedContentType = 'blockable' | 'optionally-blockable' | 'none';
    type ReferrerPolicy = 'unsafe-url' | 'no-referrer-when-downgrade' | 'no-referrer' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin';
    interface Request {
        /**
         * Request URL (without fragment).
         */
        url: string;
        /**
         * Fragment of the requested URL starting with hash, if present.
         */
        urlFragment?: string;
        /**
         * HTTP request method.
         */
        method: string;
        /**
         * HTTP request headers.
         */
        headers: Record<string, string>;
        /**
         * HTTP POST request data.
         */
        postData?: string;
        /**
         * True when the request has POST data. Note that postData might still be omitted when this flag is true when the data is too long.
         */
        hasPostData?: boolean;
        /**
         * The mixed content type of the request.
         */
        mixedContentType?: MixedContentType;
        /**
         * Priority of the resource request at the time request is sent.
         */
        initialPriority: ResourcePriority;
        /**
         * The referrer policy of the request, as defined in https://www.w3.org/TR/referrer-policy/
         */
        referrerPolicy: ReferrerPolicy;
        /**
         * Whether is loaded via link preload.
         */
        isLinkPreload?: boolean;
    }

    interface Matches extends Request {
        /**
         * body response of actual resource
         */
        body: string | Buffer | JsonCompatible
        /**
         * HTTP response headers.
         */
        responseHeaders: Record<string, string>;
        /**
         * HTTP response status code.
         */
        statusCode: number;
    }

    type PuppeteerBrowser = Partial<import('puppeteer').Browser>;
    type CDPSession = Partial<import('puppeteer').CDPSession>;
    type MockOverwriteFunction = (request: Matches, client: CDPSession) => Promise<string | Record<string, any>>;
    type MockOverwrite = string | Record<string, any> | MockOverwriteFunction;

    type MockResponseParams = {
        statusCode?: number | ((request: Matches) => number),
        headers?: Record<string, string> | ((request: Matches) => Record<string, string>),
        /**
         * fetch real response before responding with mocked data. Default: true
         */
        fetchResponse?: boolean
    }

    type MockFilterOptions = {
        method?: string | ((method: string) => boolean),
        headers?: Record<string, string> | ((headers: Record<string, string>) => boolean),
        requestHeaders?: Record<string, string> | ((headers: Record<string, string>) => boolean),
        responseHeaders?: Record<string, string> | ((headers: Record<string, string>) => boolean),
        statusCode?: number | ((statusCode: number) => boolean),
        postData?: string | ((payload: string | undefined) => boolean)
    }

    type ErrorCode = 'Failed' | 'Aborted' | 'TimedOut' | 'AccessDenied' | 'ConnectionClosed' | 'ConnectionReset' | 'ConnectionRefused' | 'ConnectionAborted' | 'ConnectionFailed' | 'NameNotResolved' | 'InternetDisconnected' | 'AddressUnreachable' | 'BlockedByClient' | 'BlockedByResponse'

    type ThrottlePreset = 'offline' | 'GPRS' | 'Regular2G' | 'Good2G' | 'Regular3G' | 'Good3G' | 'Regular4G' | 'DSL' | 'WiFi' | 'online'
    interface CustomThrottle {
        offline: boolean,
        downloadThroughput: number,
        uploadThroughput: number,
        latency: number
    }
    type ThrottleOptions = ThrottlePreset | CustomThrottle

    type AddCommandFn<IsElement extends boolean = false> = (this: IsElement extends true ? Element : BrowserObject, ...args: any[]) => any
    type OverwriteCommandFn<ElementKey extends keyof Element, BrowserKey extends keyof BrowserObject, IsElement extends boolean = false> = (this: IsElement extends true ? Element : BrowserObject, origCommand: IsElement extends true ? Element[ElementKey] : BrowserObject[BrowserKey], ...args: any[]) => any

    interface Element extends BrowserObject {
        selector: string;
        elementId: string;

        /**
         * w3c
         */
        "element-6066-11e4-a52e-4f735466cecf"?: string;

        /**
         * jsonwp
         */
        ELEMENT?: string;

        /**
         * index in array of elements
         * only applicable if the element found with `$$` command
         */
        index?: number;

        /**
         * WebdriverIO.Element or WebdriverIO.BrowserObject
         */
        parent: Element | WebdriverIO.BrowserObject;

        /**
         * true if element is a React component
         */
        isReactElement?: boolean

        /**
         * add command to `element` scope
         */
        addCommand(
            name: string,
            func: AddCommandFn<false>
        ): void;
        // ... element commands ...
    }

    interface Mock {
        /**
         * list of requests made by the browser to that mock
         */
        calls: Matches[];

        // ... mock commands ...
    }

    interface ElementArray extends Array<Element> {
        selector: string | Function;
        parent: Element | WebdriverIO.BrowserObject;
        foundWith: string;
        props: any[];
    }

    interface Timeouts {
        implicit?: number,
        pageLoad?: number,
        script?: number
    }

    interface Browser extends WebDriver.BaseClient {
        config: Config;
        options: RemoteOptions;

        /**
         * add command to `browser` or `element` scope
         */
        addCommand<IsElement extends boolean = false>(
            name: string,
            func: AddCommandFn<IsElement>,
            attachToElement?: IsElement
        ): void;

        /**
         * overwrite `browser` or `element` command
         */
        overwriteCommand<ElementKey extends keyof Element, BrowserKey extends keyof BrowserObject, IsElement extends boolean = false>(
            name: IsElement extends true ? ElementKey : BrowserKey,
            func: OverwriteCommandFn<ElementKey, BrowserKey, IsElement>,
            attachToElement?: IsElement
        ): void;

        /**
         * create custom selector
         */
        addLocatorStrategy(
            name: string,
            func: (selector: string) => HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>
        ): void
        // ... browser commands ...
    }

    interface BrowserObject {
        isMultiremote?: false;
    }

    type MultiRemoteBrowserReference = Record<string, BrowserObject>

    interface MultiRemoteBrowser extends Browser {
        /**
         * multiremote browser instance names
         */
        instances: string[];
        /**
         * flag to indicate multiremote browser session
         */
        isMultiremote: boolean;
    }

    type MultiRemoteBrowserObject = MultiRemoteBrowser & MultiRemoteBrowserReference

    interface Config extends Options, Omit<WebDriver.Options, "capabilities">, Hooks {
         /**
         * internal usage only. To run in watch mode see https://webdriver.io/docs/watcher.html
         */
        watch?: boolean;
        runnerEnv?: Record<string, any>;
    }

    interface AddValueOptions {
        translateToUnicode?: boolean
    }
}
