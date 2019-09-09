import * as childProcess from 'child_process'

import {
    runOnPrepareHook,
    runOnCompleteHook,
    runServiceHook,
    getRunnerName,
    findInConfig,
    replaceConfig,
    addServiceDeps,
    convertPackageHashToObject,
    missingConfigurationPrompt
} from '../src/utils'

import inquirer from 'inquirer'
import { runConfigHelper } from '../src/utils/runConfigHelper'

jest.mock('child_process', function () {
    const m = {
        execSyncRes: 'APPIUM_MISSING',
        execSync: function () { return m.execSyncRes }
    }
    return m
})

jest.mock('../src/utils/runConfigHelper')

beforeEach(() => {
    global.console.log = jest.fn()
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
    const hookSuccess = () => new Promise(resolve => setTimeout(resolve, 31))

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
    const hookSuccess = () => new Promise(resolve => setTimeout(resolve, 31))

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

describe('findInConfig', () => {
    it('finds text for services', () => {
        const str = "services: ['foo', 'bar'],"

        expect(findInConfig(str, 'service')).toMatchObject([
            'services: [\'foo\', \'bar\']'
        ])
    })

    it('finds text for frameworks', () => {
        const str = "framework: 'mocha'"

        expect(findInConfig(str, 'framework')).toMatchObject([
            "framework: 'mocha'"
        ])
    })
})

describe('replaceConfig', () => {
    it('correctly changes framework', () => {
        const fakeConfig = `exports.config = {
    runner: 'local',
    specs: [
        './test/specs/**/*.js'
    ],
    framework: 'mocha',
}`

        expect(replaceConfig(fakeConfig, 'framework', 'jasmine')).toBe(
            `exports.config = {
    runner: 'local',
    specs: [
        './test/specs/**/*.js'
    ],
    framework: 'jasmine',
}`
        )
    })

    it('correctly changes service', () => {
        const fakeConfig = `exports.config = {
    runner: 'local',
    specs: [
        './test/specs/**/*.js'
    ],
    services: ['chromedriver'],
    framework: 'mocha',
}`
        expect(replaceConfig(fakeConfig, 'service', 'sauce')).toBe(
            `exports.config = {
    runner: 'local',
    specs: [
        './test/specs/**/*.js'
    ],
    services: ['chromedriver','sauce'],
    framework: 'mocha',
}`
        )
    })
})

describe('addServiceDeps', () => {
    it('should add appium', () => {
        const packages = []
        addServiceDeps([{ package: '@wdio/appium-service', short: 'appium' }], packages)
        expect(packages).toEqual(['appium'])
        expect(global.console.log).not.toBeCalled()
    })

    it('should not add appium if globally installed', () => {
        childProcess.default.execSyncRes = '1.13.0'
        const packages = []
        addServiceDeps([{ package: '@wdio/appium-service', short: 'appium' }], packages)
        expect(packages).toEqual([])
        expect(global.console.log).not.toBeCalled()
    })

    it('should add appium and print message if update and appium globally installed', () => {
        const packages = []
        addServiceDeps([{ package: '@wdio/appium-service', short: 'appium' }], packages, true)
        expect(packages).toEqual([])
        expect(global.console.log).toBeCalled()
    })

    it('should add chromedriver', () => {
        const packages = []
        addServiceDeps([{ package: 'wdio-chromedriver-service', short: 'chromedriver' }], packages)
        expect(packages).toEqual(['chromedriver'])
        expect(global.console.log).not.toBeCalled()
    })

    it('should add chromedriver and print message if update', () => {
        const packages = []
        addServiceDeps([{ package: 'wdio-chromedriver-service', short: 'chromedriver' }], packages, true)
        expect(packages).toEqual(['chromedriver'])
        expect(global.console.log).toBeCalled()
    })

    afterEach(() => {
        global.console.log.mockClear()
    })
})

describe('convertPackageHashToObject', () => {
    it('works with default `$--$` hash', () => {
        expect(convertPackageHashToObject('test/package-name$--$package-name')).toMatchObject({
            package: 'test/package-name',
            short: 'package-name'
        })
    })

    it('works with custom hash', () => {
        expect(convertPackageHashToObject('test/package-name##-##package-name', '##-##')).toMatchObject({
            package: 'test/package-name',
            short: 'package-name'
        })
    })
})

describe('missingConfigurationPromp', () => {
    it('should prompt user', async () => {
        jest.spyOn(inquirer, 'prompt').mockImplementation(() => ({ config: true }))

        await missingConfigurationPrompt()

        expect(inquirer.prompt).toHaveBeenCalled()
    })

    it('should exit process if user chooses not to create config file', async () => {
        jest.spyOn(inquirer, 'prompt').mockImplementation(() => ({ config: false }))
        jest.spyOn(console, 'log')
        jest.spyOn(process, 'exit').mockImplementation(() => {})

        await missingConfigurationPrompt('test', 'Test fail message')

        expect(console.log).toHaveBeenCalledWith('Test fail message')
        expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should call function to initalize configuration helper', async () => {
        jest.spyOn(inquirer, 'prompt').mockImplementation(() => ({ config: false }))

        await missingConfigurationPrompt('test')

        expect(runConfigHelper).toHaveBeenCalled()
        expect(runConfigHelper).toHaveBeenCalledWith({ exit: false })
    })

    afterAll(() => {
        runConfigHelper.mockClear()
        inquirer.prompt.mockClear()
        process.exit.mockClear()
    })
})

afterEach(() => {
    global.console.log.mockClear()
})
