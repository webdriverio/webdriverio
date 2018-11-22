import { filterPackageName, getLauncher, runServiceHook } from '../src/utils'

jest.mock('@wdio/config', () => ({
    initialisePlugin: jest.fn().mockImplementationOnce(() => ({
        onPrepare: jest.fn(),
        onComplete: jest.fn()
    })).mockImplementationOnce(() => ({
        onPrepare: jest.fn(),
        onComplete: jest.fn()
    })).mockImplementationOnce(
        () => { throw new Error(`Couldn't find plugin`) }
    ).mockImplementationOnce(() => { throw new Error('buhh') })
}))

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
    })).toHaveLength(3)
})

test('getLauncher failing if syntax error', () => {
    expect(() => getLauncher({
        services: ['other-unscoped']
    })).toThrow('buhh')
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
