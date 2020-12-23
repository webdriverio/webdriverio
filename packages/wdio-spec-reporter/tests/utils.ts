import { AnyCapabilites, Hook, Suite, Test, StepArgument } from '../src'

export interface RunnerConfigOptions {
    sessionId?: string;
    isMultiremote?: boolean;
    capabilities?: AnyCapabilites;
    hostname?: string;
    region?: string;
    headless?: boolean;
}

export interface HookOptions{
    uid?: string;
    title?: string;
    state?: WDIOReporter.TestState;
    type?: string;
    error?: WDIOReporter.Error;
    argument?: StepArgument;
}

export interface TestOptions {
    uid?: string;
    type?: string;
    state?: WDIOReporter.TestState;
    title?: string;
    error?: WDIOReporter.Error;
    errors?: WDIOReporter.Error[];
    argument?: StepArgument;
}

export interface SuiteOptions {
    uid?: string;
    title?: string;
    description?: string;
    suites?: Suite[];
    tests?: Test[];
    hooks?: Hook[];
    hooksAndTests?: (Hook | Test)[];
}

export interface ErrorOptions {
    message: string;
    stack?: string;
}

export const getFakeHook = (opts: HookOptions = {}): Hook => {
    return {
        uid: opts.uid || 'fake-uid',
        title: opts.title || 'fake-title',
        state: opts.state || 'passed',
        type: opts.type || 'unknown-type',
        duration: 0,
        _duration: 0,
        parent: 'test-parent',
        start: new Date(),
        error: opts.error,
        argument: opts.argument,
    }
}

export const getFakeTest = (opts: TestOptions = {}): Test => {
    return {
        uid: opts.uid || 'fake-uid',
        title: opts.title || 'fake-title',
        type: opts.type || 'test',
        fullTitle: 'fake-full-title',
        state: opts.state || 'passed',
        _duration: 0,
        start: new Date(),
        error: opts.error,
        errors: opts.errors,
        argument: opts.argument,
    }
}

export const getFakeSuite = (opts: SuiteOptions = {}): Suite => {
    return {
        uid: opts.uid || 'fake-uid',
        description: opts.description,
        tests: opts.tests || [],
        hooks: opts.hooks || [],
        hooksAndTests: opts.hooksAndTests || [],
        title: opts.title || 'fake-title',
        fullTitle: 'fake-full-title',
        type: 'suite',
        suites:  opts.suites || [],
        duration: 0,
    }
}

export const getFakeError = (opts: ErrorOptions): WDIOReporter.Error => {
    return {
        message: opts.message,
        stack: opts.stack ||'',
        type: 'Error',
        expected: null,
        actual: null,
    }
}
