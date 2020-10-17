import fs from 'fs-extra'
import ejs from 'ejs'
import readDir from 'recursive-readdir'
import childProcess from 'child_process'
import { SevereServiceError } from 'webdriverio'

import {
    runLauncherHook,
    runOnCompleteHook,
    runServiceHook,
    getRunnerName,
    findInConfig,
    replaceConfig,
    addServiceDeps,
    convertPackageHashToObject,
    renderConfigurationFile,
    validateServiceAnswers,
    getCapabilities,
    hasFile,
    generateTestFiles,
    getPathForFileGeneration

} from '../src/utils'

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

jest.mock('fs-extra', () => ({
    writeFileSync: jest.fn(),
    existsSync: jest.fn(),
    ensureDirSync: jest.fn()
}))

beforeEach(() => {
    global.console.log = jest.fn()
})

describe('runServiceHook', () => {
    const hookSuccess = jest.fn()
    const slowSetupFn = jest.fn()
    const asyncHookSuccess = jest.fn().mockImplementation(() => new Promise(resolve => {
        setTimeout(() => {
            slowSetupFn()
            resolve()
        }, 20)
    }))

    beforeEach(() => {
        hookSuccess.mockClear()
        slowSetupFn.mockClear()
        asyncHookSuccess.mockClear()
    })

    test('run sync and async hooks successfully', async () => {
        await runServiceHook([
            { onPrepare: hookSuccess },
            { onPrepare: asyncHookSuccess },
            { onPrepare: 'foobar' },
        ], 'onPrepare', 1, true, 'abc')
        expect(hookSuccess).toBeCalledTimes(1)
        expect(asyncHookSuccess).toBeCalledTimes(1)
        expect(slowSetupFn).toBeCalledTimes(1)
    })

    it('executes all hooks and continues after a hook throws error', async () => {
        const hookFailing = jest.fn().mockImplementation(() => { throw new Error('buhh') })

        await runServiceHook([
            { onPrepare: hookSuccess },
            { onPrepare: 'foobar' },
            { onPrepare: asyncHookSuccess },
            { onPrepare: hookFailing },
        ], 'onPrepare', 1, true, 'abc')

        expect(hookSuccess).toBeCalledTimes(1)
        expect(hookFailing).toBeCalledTimes(1)
        expect(slowSetupFn).toBeCalledTimes(1)
        expect(asyncHookSuccess).toBeCalledTimes(1)
    })

    it('executes all hooks and stops after a hook throws SevereServiceError', async () => {
        const hookFailing = jest.fn().mockImplementation(() => { throw new SevereServiceError() })

        try {
            await runServiceHook([
                { onPrepare: hookSuccess },
                { onPrepare: 'foobar' },
                { onPrepare: asyncHookSuccess },
                { onPrepare: hookFailing },
            ], 'onPrepare', 1, true, 'abc')
        } catch (err) {
            expect(err).toEqual(expect.stringContaining('SevereServiceError'))
            expect(err).toEqual(expect.stringContaining('Stopping runner...'))
            expect(hookSuccess).toBeCalledTimes(1)
            expect(hookFailing).toBeCalledTimes(1)
            expect(slowSetupFn).toBeCalledTimes(1)
            expect(asyncHookSuccess).toBeCalledTimes(1)
        }
    })
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
    })

    it('should throw error', async () => {
        jest.spyOn(ejs, 'renderFile').mockImplementationOnce((a, b, c) => c('test error', null))

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

describe('generateTestFiles', () => {
    it('Mocha with page objects', async () => {
        readDir.mockReturnValue(Promise.resolve([
            '/foo/bar/loo/page.js.ejs',
            '/foo/bar/example.e2e.js'
        ]))
        const answers = {
            framework: 'mocha',
            usePageObjects: true,
            generateTestFiles: true,
            destPageObjectRootPath: '/tests/page/objects/model',
            destSpecRootPath: '/tests/specs'
        }

        await generateTestFiles(answers)

        expect(readDir).toBeCalledTimes(2)
        expect(readDir.mock.calls[0][0]).toContain('mochaJasmine')
        expect(readDir.mock.calls[1][0]).toContain('pageobjects')

        /**
         * test readDir callback
         */
        const readDirCb = readDir.mock.calls[0][1][0]
        const stats = { isDirectory: jest.fn().mockReturnValue(false) }
        expect(readDirCb('/foo/bar.lala', stats)).toBe(true)
        expect(readDirCb('/foo/bar.js.ejs', stats)).toBe(false)
        expect(readDirCb('/foo/bar.feature', stats)).toBe(false)
        stats.isDirectory.mockReturnValue(true)
        expect(readDirCb('/foo/bar.lala', stats)).toBe(false)
        expect(readDirCb('/foo/bar.js.ejs', stats)).toBe(false)
        expect(readDirCb('/foo/bar.feature', stats)).toBe(false)

        expect(ejs.renderFile).toBeCalledTimes(4)
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/loo/page.js.ejs',
            answers,
            expect.any(Function)
        )
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/example.e2e.js',
            answers,
            expect.any(Function)
        )
        expect(fs.ensureDirSync).toBeCalledTimes(4)
        expect(fs.writeFileSync.mock.calls[0][0].endsWith('/page/objects/model/page.js'))
            .toBe(true)
        expect(fs.writeFileSync.mock.calls[1][0].endsWith('/example.e2e.js'))
            .toBe(true)
    })

    it('Jasmine with page generation and no pageObjects', async () => {
        readDir.mockReturnValue(Promise.resolve([
        ]))
        const answers = {
            specs: './tests/e2e/**/*.js',
            framework: 'jasmine',
            generateTestFiles: false,
            usePageObjects: false
        }

        await generateTestFiles(answers)

        expect(readDir).toBeCalledTimes(1)
        expect(ejs.renderFile).toBeCalledTimes(0)
    })

    it('Cucumber with page generation and no pageObjects', async () => {
        readDir.mockReturnValue(Promise.resolve([
        ]))
        const answers = {
            specs: './tests/e2e/**/*.js',
            framework: 'cucumber',
            generateTestFiles: false,
            usePageObjects: false,
        }

        await generateTestFiles(answers)

        expect(readDir).toBeCalledTimes(1)
        expect(ejs.renderFile).toBeCalledTimes(0)
    })

    it('Cucumber without page objects', async () => {
        readDir.mockReturnValue(Promise.resolve([
            '/foo/bar/loo/step_definition/example.step.js',
            '/foo/bar/example.feature'
        ]))
        const answers = {
            specs: './tests/e2e/*.js',
            framework: 'cucumber',
            stepDefinitions: '/some/step/defs',
            usePageObjects: false,
            generateTestFiles: true
        }
        await generateTestFiles(answers)

        expect(readDir).toBeCalledTimes(1)
        expect(readDir.mock.calls[0][0]).toContain('cucumber')
        expect(ejs.renderFile).toBeCalledTimes(2)
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/loo/step_definition/example.step.js',
            answers,
            expect.any(Function)
        )
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/example.feature',
            answers,
            expect.any(Function)
        )
        expect(fs.ensureDirSync).toBeCalledTimes(2)
    })

    it('Cucumber with page objects and TypeScript', async () => {
        readDir.mockReturnValue(Promise.resolve([
            '/foo/bar/loo/page.js.ejs',
            '/foo/bar/loo/step_definition/example.step.js',
            '/foo/bar/example.feature'
        ]))
        const answers = {
            framework: 'cucumber',
            usePageObjects: true,
            isUsingTypeScript: true,
            stepDefinitions: '/some/step',
            destPageObjectRootPath: '/some/page/objects',
            relativePath : '../page/object'
        }
        await generateTestFiles(answers)

        expect(readDir).toBeCalledTimes(2)
        expect(readDir.mock.calls[0][0]).toContain('cucumber')
        expect(ejs.renderFile).toBeCalledTimes(6)
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/loo/step_definition/example.step.js',
            answers,
            expect.any(Function)
        )
        expect(ejs.renderFile).toBeCalledWith(
            '/foo/bar/example.feature',
            answers,
            expect.any(Function)
        )
        expect(fs.ensureDirSync).toBeCalledTimes(6)
        expect(fs.writeFileSync.mock.calls[0][0].endsWith('/some/page/objects/page.ts'))
            .toBe(true)
        expect(fs.writeFileSync.mock.calls[2][0].endsWith('/example.feature'))
            .toBe(true)
    })
})

afterEach(() => {
    console.log.mockRestore()
    readDir.mockClear()
    fs.writeFileSync.mockClear()
    fs.ensureDirSync.mockClear()
    ejs.renderFile.mockClear()
})

describe('getPathForFileGeneration', () => {
    it('Cucumber with pageobjects default values', () => {
        const generatedPaths = getPathForFileGeneration({
            stepDefinitions: './features/step-definitions/steps.js',
            pages: './features/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework : {
                short:'cucumber'
            }
        })
        expect(generatedPaths.relativePath).toEqual('../pageobjects')
    })

    it('Cucumber with pageobjects default different path', () => {
        const generatedPaths = getPathForFileGeneration({
            stepDefinitions: './features/step-definitions/steps.js',
            pages: './features/page/objects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework : {
                short:'cucumber'
            }
        })
        expect(generatedPaths.relativePath).toEqual('../page/objects')
    })

    it('Mocha with pageobjects default values', () => {
        const generatedPaths = getPathForFileGeneration({
            specs: './test/specs/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework : {
                short:'mocha'
            }
        })
        expect(generatedPaths.relativePath).toEqual('../pageobjects')
    })

    it('Mocha with pageobjects different path', () => {
        const generatedPaths = getPathForFileGeneration({
            specs: './test/specs/files/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework : {
                short:'mocha'
            }
        })
        expect(generatedPaths.relativePath).toEqual('../../pageobjects')
    })

    it('Do not auto generate file', () => {
        const generatedPaths = getPathForFileGeneration({
            specs: './test/specs/files/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: false,
            usePageObjects: true,
            framework : {
                short:'mocha'
            }
        })
        expect(generatedPaths.relativePath).toEqual('')
    })

    it('Do not use PageObjects', () => {
        const generatedPaths = getPathForFileGeneration({
            specs: './test/specs/files/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: false,
            framework : {
                short:'mocha'
            }
        })
        expect(generatedPaths.relativePath).toEqual('')
    })
})
