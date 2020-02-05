import { SourceLocation, ScenarioResult } from "cucumber";

declare module "webdriverio" {
    interface HookFunctions extends CucumberHookFunctions {}
    interface Options {
        cucumberOpts?: CucumberOptions;
    }
}

declare module "@wdio/sync" {
    interface HookFunctions extends CucumberHookFunctions {}
    interface Options {
        cucumberOpts?: CucumberOptions;
    }
}

interface CucumberHookResult extends ScenarioResult {
    exception?: Error
}
interface CucumberHookObject {
    [key: string]: any;
}

interface StepData {
    uri: string,
    feature: CucumberHookObject,
    step: any
}

interface CucumberHookFunctions {
    beforeFeature?(uri: string, feature: CucumberHookObject, scenarios: CucumberHookObject[]): void;
    beforeScenario?(uri: string, feature: CucumberHookObject, scenario: CucumberHookObject, sourceLocation: SourceLocation): void;
    beforeStep?(step: StepData, context: any): void;
    afterStep?(step: StepData, context: any, result: { error?: any, result?: any, passed: boolean, duration: number }): void;
    afterScenario?(uri: string, feature: CucumberHookObject, scenario: CucumberHookObject, result: CucumberHookResult, sourceLocation: SourceLocation): void;
    afterFeature?(uri: string, feature: CucumberHookObject, scenarios: CucumberHookObject[]): void;
}

interface CucumberOptions {
    require?: string[];
    backtrace?: boolean;
    requireModule?: (string | object)[];
    dryRun?: boolean;
    failFast?: boolean;
    format?: string[];
    colors?: boolean;
    snippets?: boolean;
    source?: boolean;
    profile?: string[];
    strict?: boolean;
    tagExpression?: string;
    timeout?: number;
    ignoreUndefinedDefinitions?: boolean;
}
