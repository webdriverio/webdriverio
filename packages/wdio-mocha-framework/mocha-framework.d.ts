/// <reference types="mocha"/>

declare namespace WebDriverIO {
    interface Suite {
        title: string;
        parent: string;
        fullTitle: string;
        pending: boolean;
    }

    interface Test extends Suite {
        currentTest: string;
        passed: boolean;
        duration: any;
    }
}