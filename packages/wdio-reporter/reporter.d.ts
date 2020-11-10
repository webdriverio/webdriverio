declare namespace WDIOReporter {
    type TestState = 'passed' | 'pending' | 'failed' | 'skipped' | 'started' | 'ended';
    type ErrorType = 'AssertionError' | 'Error';
    type WDIOReporterOptions = WDIOReporterOptionsFromLogFile | WDIOReporterOptionsFromStdout;

    class Reporter {
        constructor(options: Options);

        onRunnerStart(runner: any): void;
        onBeforeCommand(command: BeforeCommand): void;
        onAfterCommand(command: AfterCommand): void;
        onSuiteStart(suite: Suite): void;
        onHookStart(hook: Hook): void;
        onHookEnd(hook: Hook): void;
        onTestStart(test: Test): void;
        onTestPass(test: Test): void;
        onTestFail(test: Test): void;
        onTestSkip(test: Test): void;
        onTestEnd(test: Test): void;
        onSuiteEnd(suite: Suite): void;
        onRunnerEnd(runner: any): void;

        private _isSynchronised: boolean;

        write(content: any): void;
    }

    interface Runner {
        cid: string
        specs: string[]
        config: WDIOReporterOptions
        isMultiremote: boolean
        sessionId?: string
        capabilities: WebDriver.DesiredCapabilities
        retry?: number
        failures?: number
        retries?: number
    }

    interface WDIOReporterBaseOptions {
        outputDir?: string
    }

    interface WDIOReporterOptionsFromStdout extends WDIOReporterBaseOptions {
        stdout: boolean
        writeStream: WriteStream
    }

    interface WDIOReporterOptionsFromLogFile extends WDIOReporterBaseOptions {
        logFile: string
    }

    interface Options {
        logFile?: string;
        logLevel?: string;
        stdout?: boolean;
    }

    interface Suite {
        duration: number;
        fullTitle: string;
        title: string;
        type: string;
        uid: string;
    }

    interface Hook {
        duration: number;
        parent: string;
        title: string;
        uid: string;
    }

    interface Test {
        _duration: number;
        title: string;
        fullTitle: string;
        state: TestState;
        errors?: Error[];
        error?: Error;
    }

    interface Error {
        message: string;
        stack: string;
        type: ErrorType;
        expected: any;
        actual: any;
    }

    interface BeforeCommand {
        method: string;
        endpoint: string;
        body: any;
        sessionId: string;
        cid: string;
    }

    interface AfterCommand {
        method: string;
        endpoint: string;
        body?: any;
        result?: any;
        sessionId: string;
        cid: string;
    }
}
declare module "@wdio/reporter" {
    export default WDIOReporter.Reporter;
}
