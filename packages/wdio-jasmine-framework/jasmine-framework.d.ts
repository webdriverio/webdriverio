/// <reference types="jasmine"/>

declare namespace WebdriverIO {
    interface Suite {
        title: string;
        fullName: string;
        file: string;
    }

    interface Test extends Suite {
        parent: string;
        passed: boolean;
    }
}