import { sep } from 'node:path'
import type { HookStats, SuiteStats, TestStats } from '@wdio/reporter'

const suite = (type = 'feature') => ({
    type,
    start: '2019-07-22T12:21:36.244Z',
    _duration: 0,
    uid: type === 'feature' ? 'MyFeature1' : 'MyScenario2',
    cid: '0-0',
    title: type === 'feature' ? 'MyFeature' : 'MyScenario',
    fullTitle: type === 'feature' ? undefined : 'MyFeature1: My Scenario',
    file: ['foo', 'bar.feature'].join(sep),
    tags: [{
        type: 'Tag',
        location: { line: 5, column: 3 },
        name: '@severity=critical'
    }, {
        type: 'Tag',
        name: '@issue=BUG-987'
    }, {
        type: 'Tag',
        name: '@testId=TST-123'
    }],
    tests: [],
    parent: type === 'feature' ? undefined : 'MyFeature1',
    description: 'My scenario description',
    hooks: [],
    suites: []
} as any)

const error = {
    message: 'AssertionError [ERR_ASSERTION]: foo == bar',
    stack: 'AssertionError [ERR_ASSERTION]: foo == bar',
    type: 'AssertionError [ERR_ASSERTION]',
    name: 'Error',
    expected: 'foo',
    actual: 'bar'
}

export function featureStart(featureLabel?: string) {
    const feature = Object.assign(suite('feature'))
    if (featureLabel) {
        feature.tags.push({
            type: 'Tag',
            name: '@feature=' + featureLabel
        })
    }
    return feature
}

export function featureEnd(results = { tests: [], hooks: [] }) {
    return Object.assign(suite('feature'), {
        _duration: 1516,
        suites: [scenarioEnd(results)],
        end: '2019-07-22T12:21:37.696Z'
    })
}

export function scenarioStart(featureLabel?: string) {
    const scenario = Object.assign(suite('scenario'))
    if (featureLabel) {
        scenario.tags.push({
            type: 'Tag',
            name: '@feature=' + featureLabel
        })
    }
    return scenario
}

export function scenarioEnd({ tests = [], hooks = [] }): SuiteStats {
    return Object.assign(suite('scenario'), {
        _duration: 1451,
        end: '2019-07-22T12:21:37.695Z',
        tests,
        hooks
    })
}

const hook = () => ({
    type: 'hook',
    start: '2019-07-22T12:21:36.246Z',
    _duration: 0,
    uid: 'hooks.js8',
    cid: '0-0',
    title: 'Hook',
    parent: 'MyFeature: MyScenario'
} as any)

export function hookStart() {
    return Object.assign(hook())
}

export function hookFail() {
    return Object.assign(hook(), {
        _duration: 1,
        errors: [error],
        error: error,
        state: 'failed',
        end: '2019-07-22T12:21:36.250Z'
    })
}

export function hookEnd(): HookStats {
    return Object.assign(hook(), {
        _duration: 4,
        errors: [],
        end: '2019-07-22T12:21:36.250Z'
    })
}

// a cucumber *step* triggers a wdio event *test*
const test = () => ({
    type: 'test',
    start: '2019-07-22T12:21:36.251Z',
    _duration: 0,
    uid: 'I do something4',
    cid: '0-0',
    title: 'I do something',
    fullTitle: 'MyFeature: MyScenario: I do something',
    output: [],
    argument: undefined,
    state: 'pending'
} as any)

const test2 = () => ({
    type: 'test',
    start: '2019-07-22T12:21:36.251Z',
    _duration: 0,
    uid: 'I check something4',
    cid: '0-0',
    title: 'I check something',
    fullTitle: 'MyFeature: MyScenario: I do something',
    output: [],
    argument: undefined,
    state: 'pending'
} as any)

const test3 = () => ({
    type: 'test',
    start: '2019-07-22T12:21:36.251Z',
    _duration: 0,
    uid: 'I check something4',
    cid: '0-0',
    title: 'I check something',
    fullTitle: 'MyFeature: MyScenario: I do something',
    output: [],
    argument: { rows: [{ cells: [] }] },
    state: 'passed'
} as any)

export function testStart(): TestStats {
    return Object.assign(test())
}

export function test2start(): TestStats {
    return Object.assign(test2())
}

export function test3Start(): TestStats {
    return Object.assign(test3())
}

export function testFail(): TestStats {
    return Object.assign(test(), {
        _duration: 10,
        errors: [error],
        error: error,
        state: 'failed',
        end: '2019-07-22T12:21:37.684Z'
    })
}

export function testSkipped(): TestStats {
    return Object.assign(test(), {
        state: 'skipped'
    })
}

export function test2Skipped(): TestStats {
    return Object.assign(test2(), {
        state: 'skipped'
    })
}

export function testPass(): TestStats {
    return Object.assign(test(), {
        _duration: 1433,
        state: 'passed',
        end: '2019-07-22T12:21:37.684Z'
    })
}
