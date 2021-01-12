import {
    SuiteStats as WDIOReporterSuiteStats,
} from '@wdio/reporter'
import { AnyCapabilites, Hook, Suite, Test } from '../src'

export interface RunnerConfigOptions {
    sessionId?: string;
    isMultiremote?: boolean;
    capabilities?: AnyCapabilites;
    hostname?: string;
    region?: string;
    headless?: boolean;
}

export const getFakeHook = (opts: Partial<Hook> = {}): Hook => {
    return {
        cid: 'fake-cid',
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
        complete: () => {},
    }
}

export const getFakeTest = (opts: Partial<Test> = {}): Test => {
    return {
        cid: 'fake-cid',
        uid: opts.uid || 'fake-uid',
        title: opts.title || 'fake-title',
        type: opts.type || 'test',
        fullTitle: 'fake-full-title',
        state: opts.state || 'passed',
        duration: 0,
        _duration: 0,
        start: new Date(),
        error: opts.error,
        errors: opts.errors,
        argument: opts.argument,
        output: [],
        complete: () => {},
        pass: () => {},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fail: (_errors?: Error[]) => {},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        skip: (_reason: string) => {},
    }
}

export const getFakeSuite = (opts: Partial<Suite> = {}): Suite => {
    return {
        cid: 'fake-cid',
        uid: opts.uid || 'fake-uid',
        description: opts.description,
        tests: opts.tests || [],
        hooks: opts.hooks || [],
        hooksAndTests: opts.hooksAndTests || [],
        title: opts.title || 'fake-title',
        fullTitle: 'fake-full-title',
        type: 'suite',
        suites:  opts.suites || [],
        start: new Date(),
        duration: 0,
        _duration: 0,
        complete: () => {},
    }
}

export const getFakeError = (opts: Partial<Error>): Error => {
    return {
        name: opts.name || 'Error',
        message: opts.message || 'generic-error',
        stack: opts.stack ||'',
    }
}

export function getSuiteRecordFromList(suites: Suite[]): Record<string, WDIOReporterSuiteStats> {
    const suiteMap = {}
    for (const s of suites) {
        suiteMap[s.uid] = s
    }
    return suiteMap
}
