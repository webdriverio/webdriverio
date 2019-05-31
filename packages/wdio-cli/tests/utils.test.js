import { runOnPrepareHook, runOnCompleteHook, filterPackageName, runServiceHook, getRunnerName } from '../src/utils'

test('filterPackageName', () => {
    const reporter = [
        ' dot - https://www.npmjs.com/package/@wdio/dot-reporter',
        ' spec - https://www.npmjs.com/package/@wdio/spec-reporter',
        ' junit - https://www.npmjs.com/package/@wdio/junit-reporter',
        ' random - https://www.npmjs.com/package/wdio-random-reporter'
    ]
    expect(filterPackageName('reporter')(reporter)).toEqual([
        '@wdio/dot-reporter',
        '@wdio/spec-reporter',
        '@wdio/junit-reporter',
        'wdio-random-reporter'
    ])
})

test('runServiceHook', () => {
    const hookSuccess = jest.fn()
    const hookFailing = jest.fn().mockImplementation(() => { throw new Error('buhh') })
    runServiceHook([
        { onPrepare: hookSuccess },
        { onPrepare: 'foobar' },
        { onPrepare: hookFailing },
        { onComplete: hookSuccess }
    ], 'onPrepare', 1, true, 'abc')
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookFailing).toBeCalledTimes(1)
})

test('runOnPrepareHook handles array of functions', () => {
    const hookSuccess = jest.fn()
    const hookFailing = jest.fn().mockImplementation(() => { throw new Error('buhh') })

    runOnPrepareHook([hookSuccess, hookFailing], {}, {})
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookFailing).toBeCalledTimes(1)
})

test('runOnPrepareHook handles async functions', async () => {
    const hookSuccess = () => new Promise(resolve => setTimeout(resolve, 30))

    const start = Date.now()
    await runOnPrepareHook([hookSuccess], {}, {})
    expect(Date.now() - start).toBeGreaterThanOrEqual(30)
})

test('runOnPrepareHook handles a single function', () => {
    const hookSuccess = jest.fn()

    runOnPrepareHook(hookSuccess, {}, {})
    expect(hookSuccess).toBeCalledTimes(1)
})

test('runOnCompleteHook handles array of functions', () => {
    const hookSuccess = jest.fn()
    const secondHook = jest.fn()

    runOnCompleteHook([hookSuccess, secondHook], {}, {})
    expect(hookSuccess).toBeCalledTimes(1)
    expect(secondHook).toBeCalledTimes(1)
})

test('runOnCompleteHook handles async functions', async () => {
    const hookSuccess = () => new Promise(resolve => setTimeout(resolve, 30))

    const start = Date.now()
    await runOnCompleteHook([hookSuccess], {}, {})
    expect(Date.now() - start).toBeGreaterThanOrEqual(30)
})

test('runOnCompleteHook handles a single function', () => {
    const hookSuccess = jest.fn()

    runOnCompleteHook(hookSuccess, {}, {})
    expect(hookSuccess).toBeCalledTimes(1)
})

test('runOnCompleteHook with no failure returns 0', async () => {
    const hookSuccess = jest.fn()
    const hookFailing = jest.fn()

    const result = await runOnCompleteHook([hookSuccess, hookFailing], {}, {})

    expect(result).not.toContain(1)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookFailing).toBeCalledTimes(1)
})

test('runOnCompleteHook with failure returns 1', async () => {
    const hookSuccess = jest.fn()
    const hookFailing = jest.fn().mockImplementation(() => { throw new Error('buhh') })

    const result = await runOnCompleteHook([hookSuccess, hookFailing], {}, {})

    expect(result).toContain(1)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookFailing).toBeCalledTimes(1)
})

test('getRunnerName', () => {
    expect(getRunnerName({ browserName: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ appPackage: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ appWaitActivity: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ app: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ platformName: 'foobar' })).toBe('foobar')
    expect(getRunnerName({})).toBe('undefined')
    expect(getRunnerName()).toBe('undefined')
    expect(getRunnerName({ foo: {} })).toBe('undefined')
    expect(getRunnerName({ foo: { capabilities: {} }, bar: {} })).toBe('undefined')
    expect(getRunnerName({ foo: { capabilities: {} } })).toBe('MultiRemote')
})
