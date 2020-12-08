// Allure is providing its own types in v2, but there's too many changes,
// so this is temporarily copied here to customize typings with allure 1
// Type definitions for allure-js-commons 0.0
// Project: https://github.com/allure-framework/allure-js
// Definitions by: Denis Artyuhovich <https://github.com/zaqqaz>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.7
declare module 'allure-js-commons/beans/step' {
    declare class Step {}
    export = Step
}

declare module 'allure-js-commons' {
    declare class Allure {
        constructor();

        setOptions(options: Allure.Options): void;
        getCurrentSuite(): Allure.Suite;
        getCurrentTest(): Allure.Test;
        startSuite(suiteName: string, timestamp?: number): void;
        endSuite(timestamp?: number): void;
        startCase(testName: string, timestamp?: number): void;
        endCase(status: Allure.Status, err?: {}, timestamp?: number): void;
        startStep(stepName?: string, timestamp?: number): void;
        endStep(status: Allure.Status, timestamp?: number): void;
        setDescription(description: string, timestamp?: number): void;
        addAttachment(attachmentName: string, buffer: any, type?: string): void;
        pendingCase(testName: string, timestamp?: number): void;
    }

    export = Allure;
    export as namespace Allure;
    declare namespace Allure {
        interface Options {
            targetDir: string;
        }

        // type Status = "passed" | "pending" | "skipped" | "failed" | "broken";
        type Status = "passed" | "pending" | "skipped" | "failed" | "broken" | "canceled";

        enum TYPE {
            TEXT = "text",
            HTML = "html",
            MARKDOWN = "markdown"
        }

        class Suite {
            currentStep: Allure.Step;
            testcases: string[];
            name: string;

            constructor(name: string, timestamp?: number);

            end(timestamp?: number): void;
            hasTests(): boolean;
            addTest(test: Test): boolean;
            toXML(): string;
        }

        class Test {
            steps: Allure.Step[];

            constructor(public name: string, timestamp?: number);

            setDescription(description: string, type: TYPE): void;
            addLabel(name: string, value?: string): void;
            addParameter(kind: any, name: string, value?: string): void;
            addStep(step: Step): void;
            addAttachment(attachment: Attachment): void;
            end(status: Status, error: Error, timestamp?: number): void;
            toXML(): string;
        }

        class Description {
            constructor(value: string, type: TYPE);

            toXML(): string;
        }

        class Step {
            attachments: Attachment[];

            constructor(name: string, timestamp?: number);

            addStep(step: Step): void;
            addAttachment(attachment: Attachment): void;
            end(status: Status, error: Error, timestamp?: number): void;
            toXML(): string;
        }

        class Attachment {
            constructor(title: string, source: any, size: number, mime: string);

            addStep(step: Step): void;
            addAttachment(attachment: Attachment): void;
            end(status: Status, error: Error, timestamp?: number): void;
            toXML(): string;
        }
    }
}
