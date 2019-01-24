import logger from '@wdio/logger'

import { filterPackageName, getLauncher, runServiceHook, getRunnerName } from '../src/utils'

jest.mock('@wdio/config', () => {
    class LauncherMock {
        constructor () {
            this.onPrepare = jest.fn()
            this.onComplete = jest.fn()
        }
    }

    return {
        initialisePlugin: jest.fn()
            .mockImplementationOnce(
                () => LauncherMock)
            .mockImplementationOnce(
                () => undefined)
            .mockImplementationOnce(
                () => { throw new Error('Couldn\'t find plugin') })
            .mockImplementationOnce(() => { throw new Error('buhh') })
    }
})

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

test('getLauncher', () => {
    expect(getLauncher({})).toEqual([])

    const inlineService = {
        onPrepare: jest.fn(),
        beforeTest: jest.fn()
    }
    expect(getLauncher({
        services: [
            inlineService,
            'unscoped',
            'scoped',
            'non-existing'
        ]
    })).toHaveLength(2)
})

test('getLauncher not failing on syntax error', () => {
    expect(() => getLauncher({
        services: ['other-unscoped']
    })).toHaveLength(0)
    expect(logger().error).toBeCalledTimes(1)
})

test('getLauncher sets correct service scope', () => {
    const hookSuccess = jest.fn()

    const inlineService = {
        onPrepare() {
            this._otherMethod()
        },
        _otherMethod: hookSuccess
    }

    const launcher = getLauncher({
        services: [
            inlineService
        ]
    })

    runServiceHook(launcher, 'onPrepare', 1, true, 'abc')
    expect(hookSuccess).toBeCalledTimes(1)
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

test('getRunnerName', () => {
    expect(getRunnerName({ browserName: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ appPackage: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ appWaitActivity: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ app: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ platformName: 'foobar' })).toBe('foobar')
    expect(getRunnerName({})).toBe('undefined')
})
