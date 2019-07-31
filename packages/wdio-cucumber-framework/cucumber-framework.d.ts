import { SourceLocation, ScenarioResult } from "cucumber";

declare module "webdriverio" {
    interface HookFunctions extends CucumberHookFunctions {}
}

declare module "@wdio/sync" {
    interface HookFunctions extends CucumberHookFunctions {}
}

interface CucumberHookResult extends ScenarioResult {
    exception?: Error
}
interface CucumberHookObject {
    [key: string]: any;
}

interface CucumberHookFunctions {
    beforeFeature?(uri: string, feature: CucumberHookObject): void;
    beforeScenario?(uri: string, feature: CucumberHookObject, scenario: CucumberHookObject): void;
    beforeStep?(uri: string, feature: CucumberHookObject, scenario: CucumberHookObject, step: CucumberHookObject, sourceLocation: SourceLocation): void;
    afterStep?(uri: string, feature: CucumberHookObject, scenario: CucumberHookObject, step: CucumberHookObject, result: CucumberHookResult, sourceLocation: SourceLocation): void;
    afterScenario?(uri: string, feature: CucumberHookObject, scenario: CucumberHookObject, result: CucumberHookResult, sourceLocation: SourceLocation): void;
    afterFeature?(uri: string, feature: CucumberHookObject): void;
}
