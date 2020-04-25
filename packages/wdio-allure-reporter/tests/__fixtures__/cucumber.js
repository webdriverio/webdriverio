const suite = (type = 'feature') => ({
    type,
    start: '2019-07-22T12:21:36.244Z',
    _duration: 0,
    uid: type === 'feature' ? 'MyFeature1' : 'MyScenario2',
    cid: '0-0',
    title: type === 'feature' ? 'MyFeature': 'MyScenario',
    fullTitle: type === 'feature' ? undefined: 'MyFeature1: My Scenario',
    tags: [{
        type: 'Tag',
        location: { line: 5, column: 3 },
        name: '@severity=critical'
    }],
    tests: [],
    description: 'My scenario description',
    hooks: [],
    suites: []
})

const error = {
    message: 'foo == bar',
    stack: 'AssertionError [ERR_ASSERTION]: foo == bar',
    type: 'AssertionError [ERR_ASSERTION]',
    name: 'AssertionError',
    expected: 'foo',
    actual: 'bar'
}

export function featureStart() {
    return Object.assign(suite('feature'))
}

export function featureEnd(results = { tests: [], hooks: [] }) {
    return Object.assign(suite('feature'), {
        _duration: 1516,
        suites: [scenarioEnd(results)],
        end: '2019-07-22T12:21:37.696Z'
    })
}

export function scenarioStart() {
    return Object.assign(suite('scenario'))
}

export function scenarioEnd({ tests = [], hooks = [] }) {
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
})

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

export function hookEnd() {
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
})

export function testStart() {
    return Object.assign(test())
}

export function testFail() {
    return Object.assign(test(), {
        _duration: 10,
        errors: [error],
        error: error,
        state: 'failed',
        end: '2019-07-22T12:21:37.684Z'
    })
}

export function testSkipped() {
    return Object.assign(test(), {
        state: 'skipped'
    })
}

export function testPass() {
    return Object.assign(test(), {
        _duration: 1433,
        state: 'passed',
        end: '2019-07-22T12:21:37.684Z'
    })
}
