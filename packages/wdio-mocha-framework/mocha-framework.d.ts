/// <reference types="mocha"/>

declare namespace WebdriverIO {
    interface Suite {
        file: string;
        title: string;
        parent: string;
        fullTitle: string;
        pending: boolean;
    }

    interface Test extends Suite {
        currentTest: string;
        passed: boolean;
        duration?: number;
        error?: {
            actual?: any;
            expected?: any;
            message: string;
            stack?: string;
            type: string;
        }
    }
}

declare module "@wdio/mocha-framework" {
    export default WebdriverIO
}
