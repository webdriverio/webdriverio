const testState = () => ({
    type: 'test',
    start: '2018-05-14T15:17:18.914Z',
    _duration: 0,
    uid: 'should can do something3',
    cid: '0-0',
    title: 'should can do something',
    fullTitle: 'My awesome feature should can do something',
    state: 'pending',
    featureName: 'feature foo bar',
    scenarioName: 'story foo bar'
} as any)

export function testStart(): WDIOReporter.Test {
    return testState()
}

export function testPassed() {
    return Object.assign(testState(), { state: 'passed', end: '2018-05-14T15:17:21.631Z', _duration: 2730 })
}

export function testFailed() {
    const error =
        {
            message: 'AssertionError [ERR_ASSERTION]: foo == bar',
            stack: 'AssertionError [ERR_ASSERTION]: foo == bar',
            type: 'AssertionError [ERR_ASSERTION]',
            name: 'Error',
            expected: 'foo',
            actual: 'bar'
        }
    return Object.assign(testState(), { error, state: 'failed', end: '2018-05-14T15:17:21.631Z', _duration: 2730 })
}

export function testFailedWithMultipleErrors() {
    const errors =
    [
        {
            message: 'ReferenceError: All is Dust',
            stack: 'ReferenceError: All is Dust'
        },
        {
            message: 'InternalError: Abandon Hope',
            stack: 'InternalError: Abandon Hope'
        }
    ]
    return Object.assign(testState(), { errors, state: 'failed', end: '2018-05-14T15:17:21.631Z', _duration: 2730 })
}

export function testFailedWithAssertionErrorFromExpectWebdriverIO() {
    const errors =
    [
        {
            message: 'Expect $(`login-app`).$(`<fn>`).$(`<fn>`).$(`<fn>`) to be displayed\n' +
            'Expected: \u001b[32m"displayed"\u001b[39m\n' +
            'Received: \u001b[31m"\u001b[7mnot \u001b[27mdisplayed"\u001b[39m',
            stack: 'Error: Expect $(`content-production-app`).$(`<fn>`).$(`<fn>`).$(`<fn>`) to be displayed\n' +
            '\n' +
            'Expected: \u001b[32m"displayed"\u001b[39m\n' +
            'Received: \u001b[31m"\u001b[7mnot \u001b[27mdisplayed"\u001b[39m\n' +
            '    at World.<anonymous> (then.js:271:21)\n' +
            '    at World.executeSync (node_modules/@wdio/sync/build/index.js:56:18)\n' +
            '    at node_modules/@wdio/sync/build/index.js:82:70',
            name: 'Error',
        }
    ]
    const error =
        {
            message: 'Expect $(`login-app`).$(`<fn>`).$(`<fn>`).$(`<fn>`) to be displayed\n' +
            'Expected: \u001b[32m"displayed"\u001b[39m\n' +
            'Received: \u001b[31m"\u001b[7mnot \u001b[27mdisplayed"\u001b[39m',
            stack: 'Error: Expect $(`content-production-app`).$(`<fn>`).$(`<fn>`).$(`<fn>`) to be displayed\n' +
            '\n' +
            'Expected: \u001b[32m"displayed"\u001b[39m\n' +
            'Received: \u001b[31m"\u001b[7mnot \u001b[27mdisplayed"\u001b[39m\n' +
            '    at World.<anonymous> (then.js:271:21)\n' +
            '    at World.executeSync (node_modules/@wdio/sync/build/index.js:56:18)\n' +
            '    at node_modules/@wdio/sync/build/index.js:82:70',
            name: 'Error',
        }
    return Object.assign(testState(), { errors, error, state: 'failed', end: '2018-05-14T15:17:21.631Z', _duration: 2730 })
}

export function testPending() {
    return Object.assign(testState(), { state: 'pending', end: '2018-05-14T15:17:21.631Z', _duration: 0 })
}

const allHookState = () => ({
    type: 'hook',
    start: '2018-05-14T15:17:18.914Z',
    _duration: 0,
    uid: 'hook-00-0',
    cid: '0-0',
    title: '"before all" hook for "should login with valid credentials"',
    parent: 'Login',
} as any)

const eachHookState = () => ({
    type: 'hook',
    start: '2018-05-14T15:17:18.914Z',
    _duration: 0,
    uid: 'hook-00-0',
    cid: '0-0',
    title: '"before each" hook',
    currentTest: 'My Login application',
    parent: 'Login',
} as any)

export function hookStart(): WDIOReporter.Hook {
    return allHookState()
}

export function eachHookStart(): WDIOReporter.Hook {
    return eachHookState()
}

export function hookPassed(): WDIOReporter.Hook {
    return Object.assign(allHookState(), { state: 'passed', end: '2018-05-14T15:17:21.631Z', _duration: 2730 })
}

export function hookFailed(): WDIOReporter.Hook {
    const error =
    {
        message: 'element ("body") still existing after 100ms',
        stack: 'Error: element ("body") still existing after 100ms',
        type: 'Error',
    }
    return Object.assign(allHookState(), { error, errors: [error], state: 'failed', end: '2018-05-14T15:17:21.631Z', _duration: 2730 })
}

export function eachHookFailed(): WDIOReporter.Hook {
    const error =
        {
            message: 'element ("body") still existing after 100ms',
            stack: 'Error: element ("body") still existing after 100ms',
            type: 'Error',
        }
    return Object.assign(eachHookState(), { error, errors: [error], state: 'failed', end: '2018-05-14T15:17:21.631Z', _duration: 2730 })
}
