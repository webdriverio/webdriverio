import fs from 'fs'
import ejs from 'ejs'
import childProcess from 'child_process'

import {
    runLauncherHook,
    runOnCompleteHook,
    runServiceHook,
    getRunnerName,
    findInConfig,
    replaceConfig,
    addServiceDeps,
    convertPackageHashToObject,
    missingConfigurationPrompt,
    renderConfigurationFile,
    validateServiceAnswers,
    getCapabilities,
    hasFile
} from '../src/utils'

import inquirer from 'inquirer'
import { runConfig } from '../src/commands/config'
import { CONFIG_HELPER_SUCCESS_MESSAGE } from '../src/constants'

jest.mock('child_process', function () {
    const m = {
        execSyncRes: 'APPIUM_MISSING',
        execSync: function () { return m.execSyncRes }
    }
    return m
})

jest.mock('../src/commands/config.js', () => ({
    runConfig: jest.fn()
}))

jest.mock('fs')

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

test('runLauncherHook handles array of functions', () => {
    const hookSuccess = jest.fn()
    const hookFailing = jest.fn().mockImplementation(() => { throw new Error('buhh') })

    runLauncherHook([hookSuccess, hookFailing], 1, 2, 3, 4, 5, 6)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookSuccess).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6)
    expect(hookFailing).toBeCalledTimes(1)
    expect(hookFailing).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6)
})

test('runLauncherHook handles async functions', async () => {
    const hookSuccess = () => new Promise(resolve => setTimeout(resolve, 31))

    const start = Date.now()
    await runLauncherHook([hookSuccess], {}, {})
    expect(Date.now() - start).toBeGreaterThanOrEqual(30)
})

test('runLauncherHook handles a single function', () => {
    const hookSuccess = jest.fn()

    runLauncherHook(hookSuccess, 1, 2, 3, 4, 5, 6)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookSuccess).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6)
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

describe('renderConfigurationFile', () => {
    it('should write file', async () => {
        jest.spyOn(ejs, 'renderFile').mockImplementation((a, b, c) => c(null, true))

        await renderConfigurationFile({ foo: 'bar' })

        expect(ejs.renderFile).toHaveBeenCalled()
        expect(fs.writeFileSync).toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith(CONFIG_HELPER_SUCCESS_MESSAGE)
    })

    it('should throw error', async () => {
        jest.spyOn(ejs, 'renderFile').mockImplementation((a, b, c) => c('test error', null))

        try {
            await renderConfigurationFile({ foo: 'bar' })
        } catch (error) {
            expect(error).toBeTruthy()
        }
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
        childProcess.execSyncRes = '1.13.0'
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
        inquirer.prompt.mockImplementation(() => ({ config: true }))
        await missingConfigurationPrompt()
        expect(inquirer.prompt).toHaveBeenCalled()
    })

    it('should call function to initalize configuration helper', async () => {
        await missingConfigurationPrompt('test')
        expect(runConfig).toHaveBeenCalledWith(false, false, true)
    })

    it('should pass "yarn" flag to runConfig', async () => {
        await missingConfigurationPrompt('test', 'test message', true)
        expect(runConfig).toHaveBeenCalledWith(true, false, true)
    })

    it('should throw if error occurs', async () => {
        runConfig.mockImplementation(Promise.reject)

        try {
            await missingConfigurationPrompt('test')
        } catch (error) {
            expect(error).toBeTruthy()
        }
    })

    afterEach(() => {
        runConfig.mockClear()
        inquirer.prompt.mockClear()
    })
})

test('validateServiceAnswers', () => {
    expect(validateServiceAnswers(['wdio-chromedriver-service', '@wdio/selenium-standalone-service']))
        .toContain('wdio-chromedriver-service cannot work together with @wdio/selenium-standalone-service')
    expect(validateServiceAnswers(['@wdio/static-server-service', '@wdio/selenium-standalone-service']))
        .toBe(true)
})

describe('getCapabilities', () => {
    it('should return driver with capabilities for android', () => {
        expect(getCapabilities({ option: 'foo.apk' })).toMatchSnapshot()
        expect(getCapabilities({ option: 'android' })).toMatchSnapshot()
    })

    it('should return driver with capabilities for ios', () => {
        expect(getCapabilities({ option: 'foo.app', deviceName: 'fooName', udid: 'num', platformVersion: 'fooNum' })).toMatchSnapshot()
        expect(getCapabilities({ option: 'ios' })).toMatchSnapshot()
    })

    it('should return driver with capabilities for desktop', () => {
        expect(getCapabilities({ option: 'chrome' })).toMatchSnapshot()
    })
})

test('hasFile', () => {
    fs.existsSync.mockReturnValue(true)
    expect(hasFile('package.json')).toBe(true)
    fs.existsSync.mockReturnValue(false)
    expect(hasFile('xyz')).toBe(false)
})

afterEach(() => {
    console.log.mockRestore()
})
