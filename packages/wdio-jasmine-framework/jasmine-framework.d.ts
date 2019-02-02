/// <reference types="jasmine"/>

declare namespace WebDriverIO {
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