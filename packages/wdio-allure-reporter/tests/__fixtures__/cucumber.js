const suite = (type = 'feature') => ({
    type,
    start: '2019-07-22T12:21:36.244Z',
    _duration: 0,
    uid: type === 'feature' ? 'MyFeature1' : 'MyScenario2',
    cid: '0-0',
    title: type === 'feature' ? 'MyFeature': 'MyScenario',
    fullTitle: type === 'feature' ? undefined: 'MyFeature1: My Scenario',
    tests: [],
    hooks: [],
    suites: []
})

export function featureStart() {
    return Object.assign(suite('feature'))
}

export function featureEnd() {
    return Object.assign(suite('feature'), {
        _duration: 1516,
        suites: [scenarioEnd()],
        end: '2019-07-22T12:21:37.696Z'
    })
}

export function scenarioStart() {
    return Object.assign(suite('scenario'))
}

export function scenarioEnd() {
    return Object.assign(suite('scenario'), {
        _duration: 1451,
        tests: [testPass()],
        hooks: [hookEnd()],
        end: '2019-07-22T12:21:37.695Z'
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
        // todo
    })
}
export function testPass() {
    return Object.assign(test(), {
        _duration: 1433,
        state: 'passed',
        end: '2019-07-22T12:21:37.684Z'
    })
}
