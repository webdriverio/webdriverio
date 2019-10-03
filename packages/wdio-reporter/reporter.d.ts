declare namespace WDIOReporter {
    type TestState = 'passed' | 'pending' | 'failed' | 'skipped';
    type ErrorType = 'AssertionError' | 'Error';

    class Reporter {
        constructor (options: Options);

        onRunnerStart(): void;
        onBeforeCommand(): void;
        onAfterCommand(): void;
        onScreenshot(): void;
        onSuiteStart(suite: Suite): void;
        onHookStart(hook: Hook): void;
        onHookEnd(hook: Hook): void;
        onTestStart(test: Test): void;
        onTestPass(test: Test): void;
        onTestFail(test: Test): void;
        onTestSkip(test: Test): void;
        onTestEnd(test: Test): void;
        onSuiteEnd(suite: Suite): void;
        onRunnerEnd(): void;

        isSynchronised: boolean;
    }

    interface Options {
        configFile: string;
        logFile: string;
        logLevel: string;
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
}

declare module "@wdio/reporter" {
    export default WDIOReporter.Reporter;
}
