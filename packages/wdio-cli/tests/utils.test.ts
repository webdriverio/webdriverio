import { vi, describe, it, expect, afterEach, beforeEach, test } from 'vitest'
import path from 'node:path'
import * as cp from 'node:child_process'
import fs from 'node:fs/promises'
import ejs from 'ejs'
import inquirer from 'inquirer'
import readDir from 'recursive-readdir'
import yarnInstall from 'yarn-install'
import { readPackageUp } from 'read-pkg-up'
import { SevereServiceError } from 'webdriverio'
import { ConfigParser } from '@wdio/config'

import {
    runLauncherHook,
    runOnCompleteHook,
    runServiceHook,
    getRunnerName,
    findInConfig,
    replaceConfig,
    addServiceDeps,
    convertPackageHashToObject,
    validateServiceAnswers,
    getCapabilities,
    generateTestFiles,
    getPathForFileGeneration,
    getDefaultFiles,
    hasPackage,
    specifyVersionIfNeeded,
    getProjectRoot,
    detectCompiler,
    getAnswers,
    getProjectProps,
    runProgram,
    createPackageJSON,
    npmInstall,
    setupTypeScript,
    setupBabel,
    createWDIOConfig,
    createWDIOScript
} from '../src/utils.js'
import { parseAnswers } from '../src/commands/config.js'
import { COMPILER_OPTION_ANSWERS, COMPILER_OPTIONS } from '../src/constants.js'
import { hasBabelConfig } from '../build/utils.js'

vi.mock('ejs')
vi.mock('inquirer')
vi.mock('recursive-readdir')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('child_process', () => {
    const m = {
        execSyncRes: 'APPIUM_MISSING',
        execSync: () => m.execSyncRes,
        spawn: vi.fn().mockReturnValue({ on: vi.fn().mockImplementation((ev, fn) => fn(0)) })
    }
    return m
})

vi.mock('read-pkg-up', () => ({
    readPackageUp: vi.fn().mockResolvedValue({
        path: '/foo/bar',
        packageJson: {
            name: 'cool-test-module',
            type: 'module'
        }
    })
}))

vi.mock('yarn-install', () => ({ default: vi.fn().mockReturnValue({ status: 0 }) }))

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockResolvedValue({}),
        mkdir: vi.fn(),
        writeFile: vi.fn().mockReturnValue(Promise.resolve())
    }
}))

vi.mock('@wdio/config', () => ({
    ConfigParser: class ConfigParserMock {
        initialize () {}
        getCapabilities () {}
    }
}))

beforeEach(() => {
    global.console.log = vi.fn()
})

describe('runServiceHook', () => {
    const hookSuccess = vi.fn()
    const slowSetupFn = vi.fn()
    const asyncHookSuccess = vi.fn().mockImplementation(() => new Promise<void>(resolve => {
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

    it('run sync and async hooks successfully', async () => {
        await runServiceHook([
            { onPrepare: hookSuccess },
            { onPrepare: asyncHookSuccess },
            // @ts-ignore test invalid parameter
            { onPrepare: 'foobar' },
        ], 'onPrepare', 1, true, 'abc')
        expect(hookSuccess).toBeCalledTimes(1)
        expect(asyncHookSuccess).toBeCalledTimes(1)
        expect(slowSetupFn).toBeCalledTimes(1)
    })

    it('executes all hooks and continues after a hook throws error', async () => {
        const hookFailing = vi.fn().mockImplementation(() => { throw new Error('buhh') })

        await runServiceHook([
            { onPrepare: hookSuccess },
            // @ts-ignore test invalid parameter
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
        const hookFailing = vi.fn().mockImplementation(() => { throw new SevereServiceError() })

        try {
            await runServiceHook([
                { onPrepare: hookSuccess },
                // @ts-ignore test invalid parameter
                { onPrepare: 'foobar' },
                { onPrepare: asyncHookSuccess },
                { onPrepare: hookFailing },
            ], 'onPrepare', 1, true, 'abc')
        } catch (err: any) {
            expect(err.message).toEqual(expect.stringContaining('SevereServiceError'))
            expect(err.message).toEqual(expect.stringContaining('Stopping runner...'))
            expect(hookSuccess).toBeCalledTimes(1)
            expect(hookFailing).toBeCalledTimes(1)
            expect(slowSetupFn).toBeCalledTimes(1)
            expect(asyncHookSuccess).toBeCalledTimes(1)
        }
    })
})

test('runLauncherHook handles array of functions', () => {
    const hookSuccess = vi.fn()
    const hookFailing = vi.fn().mockImplementation(() => { throw new Error('buhh') })

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
    const hookSuccess = vi.fn()

    runLauncherHook(hookSuccess, 1, 2, 3, 4, 5, 6)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookSuccess).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6)
})

test('runOnCompleteHook handles array of functions', () => {
    const hookSuccess = vi.fn()
    const secondHook = vi.fn()

    runOnCompleteHook([hookSuccess, secondHook], { capabilities: {} }, {}, 0, {} as any)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(secondHook).toBeCalledTimes(1)
})

test('runOnCompleteHook handles async functions', async () => {
    const hookSuccess = () => new Promise(resolve => setTimeout(resolve, 31))

    const start = Date.now()
    await runOnCompleteHook([hookSuccess], { capabilities: {} }, {}, 0, {} as any)
    expect(Date.now() - start).toBeGreaterThanOrEqual(30)
})

test('runOnCompleteHook handles a single function', () => {
    const hookSuccess = vi.fn()

    runOnCompleteHook(hookSuccess, { capabilities: {} }, {}, 0, {} as any)
    expect(hookSuccess).toBeCalledTimes(1)
})

test('runOnCompleteHook with no failure returns 0', async () => {
    const hookSuccess = vi.fn()
    const hookFailing = vi.fn()

    const result = await runOnCompleteHook([hookSuccess, hookFailing], { capabilities: {} }, {}, 0, {} as any)

    expect(result).not.toContain(1)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookFailing).toBeCalledTimes(1)
})

test('runOnCompleteHook with failure returns 1', async () => {
    const hookSuccess = vi.fn()
    const hookFailing = vi.fn().mockImplementation(() => { throw new Error('buhh') })

    const result = await runOnCompleteHook([hookSuccess, hookFailing], { capabilities: {} }, {}, 0, {} as any)

    expect(result).toContain(1)
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookFailing).toBeCalledTimes(1)
})

test('runOnCompleteHook fails with SevereServiceError', async () => {
    const hookSuccess = vi.fn()
    const hookFailing = vi.fn().mockImplementation(() => { throw new SevereServiceError('buhh') })

    const result = await runOnCompleteHook([hookSuccess, hookFailing], { capabilities: {} }, {}, 0, {} as any)
        .catch(() => 'some error')

    expect(result).toBe('some error')
    expect(hookSuccess).toBeCalledTimes(1)
    expect(hookFailing).toBeCalledTimes(1)
})

test('getRunnerName', () => {
    expect(getRunnerName({ 'appium:appPackage': 'foobar' })).toBe('foobar')
    expect(getRunnerName({ 'appium:appWaitActivity': 'foobar' })).toBe('foobar')
    expect(getRunnerName({ 'appium:app': 'foobar' })).toBe('foobar')
    expect(getRunnerName({ 'appium:platformName': 'foobar' })).toBe('foobar')
    expect(getRunnerName({ browserName: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ appPackage: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ appWaitActivity: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ app: 'foobar' })).toBe('foobar')
    expect(getRunnerName({ platformName: 'foobar' })).toBe('foobar')
    expect(getRunnerName({})).toBe('undefined')
    expect(getRunnerName()).toBe('undefined')
    // @ts-ignore test invalid parameter
    expect(getRunnerName({ foo: {} })).toBe('undefined')
    // @ts-ignore test invalid parameter
    expect(getRunnerName({ foo: { capabilities: {} }, bar: {} })).toBe('undefined')
    // @ts-ignore test invalid parameter
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
        const packages: any = []
        addServiceDeps([{ package: '@wdio/appium-service', short: 'appium' }], packages)
        expect(packages).toEqual(['appium'])
    })

    it('should not add appium if globally installed', () => {
        // @ts-ignore
        // eslint-disable-next-line no-import-assign, @typescript-eslint/no-unused-vars
        cp.execSyncRes = '1.13.0'
        const packages: any = []
        addServiceDeps([{ package: '@wdio/appium-service', short: 'appium' }], packages)
        expect(packages).toEqual([])
    })

    it('should add chromedriver', () => {
        const packages: any = []
        addServiceDeps([{ package: 'wdio-chromedriver-service', short: 'chromedriver' }], packages)
        expect(packages).toEqual(['chromedriver'])
    })

    it('should add geckodriver', () => {
        const packages: any = []
        addServiceDeps([{ package: 'wdio-geckodriver-service', short: 'geckodriver' }], packages)
        expect(packages).toEqual(['geckodriver'])
    })

    it('should add edgedriver', () => {
        const packages: any = []
        addServiceDeps([{ package: 'wdio-edgedriver-service', short: 'edgedriver' }], packages)
        expect(packages).toEqual(['msedgedriver'])
    })

    afterEach(() => {
        vi.mocked(global.console.log).mockClear()
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
    it('should return driver with capabilities for android', async () => {
        expect(await getCapabilities({ option: 'foo.apk' } as any)).toMatchSnapshot()
        expect(await getCapabilities({ option: 'android' } as any)).toMatchSnapshot()
    })

    it('should return driver with capabilities for ios', async () => {
        expect(await getCapabilities({ option: 'foo.app', deviceName: 'fooName', udid: 'num', platformVersion: 'fooNum' } as any))
            .toMatchSnapshot()
        expect(await getCapabilities({ option: 'ios' } as any)).toMatchSnapshot()
    })

    it('should return driver with capabilities for desktop', async () => {
        expect(await getCapabilities({ option: 'chrome' } as any)).toMatchSnapshot()
    })

    it('should throw config not found error', async () => {
        const initializeMock = vi.spyOn(ConfigParser.prototype, 'initialize')
        initializeMock.mockImplementationOnce(() => {
            const error: any = new Error('ups')
            error.code = 'MODULE_NOT_FOUND'
            return Promise.reject(error)
        })
        await expect(() => getCapabilities({ option: './test.js', capabilities: 2 } as any))
            .rejects.toThrowErrorMatchingSnapshot()
        initializeMock.mockImplementationOnce(async () => { throw new Error('ups') })
        await expect(() => getCapabilities({ option: './test.js', capabilities: 2 } as any))
            .rejects.toThrowErrorMatchingSnapshot()
    })

    it('should throw capability not provided', async () => {
        await expect(() => getCapabilities({ option: '/path/to/config.js' } as any))
            .rejects.toThrowErrorMatchingSnapshot()
    })

    it('should through capability not found', async () => {
        const cap = { browserName: 'chrome' }
        const getCapabilitiesMock = vi.spyOn(ConfigParser.prototype, 'getCapabilities')
        getCapabilitiesMock.mockReturnValue([cap, cap, cap, cap, cap])
        await expect(() => getCapabilities({ option: '/path/to/config.js', capabilities: 5 } as any))
            .rejects.toThrowErrorMatchingSnapshot()
    })

    it('should get capability from wdio.conf.js', async () => {
        const autoCompileMock = vi.spyOn(ConfigParser.prototype, 'initialize')
        const getCapabilitiesMock = vi.spyOn(ConfigParser.prototype, 'getCapabilities')
        getCapabilitiesMock.mockReturnValue([
            { browserName: 'chrome' },
            {
                browserName: 'firefox',
                specs: ['/path/to/some/specs.js']
            },
            {
                maxInstances: 5,
                browserName: 'chrome',
                acceptInsecureCerts: true,
                'goog:chromeOptions' : { 'args' : ['window-size=8000,1200'] }
            }
        ])
        expect(await getCapabilities({ option: '/path/to/config.js', capabilities: 2 } as any))
            .toMatchSnapshot()
        expect(autoCompileMock).toBeCalledTimes(1)
    })
})

test('hasPackage', async () => {
    expect(await hasPackage('yargs')).toBe(true)
    expect(await hasPackage('foobar')).toBe(false)
})

describe('generateTestFiles', () => {
    it('Mocha with page objects', async () => {
        vi.mocked(readDir).mockResolvedValue([
            '/foo/bar/loo/page.js.ejs',
            '/foo/bar/example.e2e.js'
        ] as any)
        const answers = {
            framework: 'mocha',
            usePageObjects: true,
            generateTestFiles: true,
            destPageObjectRootPath: '/tests/page/objects/model',
            destSpecRootPath: '/tests/specs'
        }

        await generateTestFiles(answers as any)

        expect(readDir).toBeCalledTimes(2)
        expect(vi.mocked(readDir).mock.calls[0][0]).toContain('mocha')
        expect(vi.mocked(readDir).mock.calls[1][0]).toContain('pageobjects')

        /**
         * test readDir callback
         */
        const readDirCb = vi.mocked(readDir).mock.calls[0][1][0] as Function
        const stats = { isDirectory: vi.fn().mockReturnValue(false) }
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
        expect(fs.mkdir).toBeCalledTimes(4)
        expect((vi.mocked(fs.writeFile).mock.calls[0][0] as string)
            .endsWith(`${path.sep}page${path.sep}objects${path.sep}model${path.sep}page.js`))
            .toBe(true)
        expect((vi.mocked(fs.writeFile).mock.calls[1][0] as string)
            .endsWith(`${path.sep}example.e2e.js`))
            .toBe(true)
    })

    it('jasmine with page objects', async () => {
        vi.mocked(readDir).mockResolvedValue([
            '/foo/bar/loo/page.js.ejs',
            '/foo/bar/example.e2e.js'
        ] as any)
        const answers = {
            framework: 'jasmine',
            usePageObjects: true,
            generateTestFiles: true,
            destPageObjectRootPath: '/tests/page/objects/model',
            destSpecRootPath: '/tests/specs'
        }

        await generateTestFiles(answers as any)

        expect(readDir).toBeCalledTimes(2)
        expect(vi.mocked(readDir).mock.calls[0][0]).toContain('jasmine')
        expect(vi.mocked(readDir).mock.calls[1][0]).toContain('pageobjects')

        /**
         * test readDir callback
         */
        const readDirCb = vi.mocked(readDir).mock.calls[0][1][0] as Function
        const stats = { isDirectory: vi.fn().mockReturnValue(false) }
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
        expect(fs.mkdir).toBeCalledTimes(4)
        expect((vi.mocked(fs.writeFile).mock.calls[0][0] as string)
            .endsWith(`${path.sep}page${path.sep}objects${path.sep}model${path.sep}page.js`))
            .toBe(true)
        expect((vi.mocked(fs.writeFile).mock.calls[1][0] as string)
            .endsWith(`${path.sep}example.e2e.js`))
            .toBe(true)
    })

    it('Jasmine with page generation and no pageObjects', async () => {
        vi.mocked(readDir).mockResolvedValue([] as any)
        const answers = {
            specs: './tests/e2e/**/*.js',
            framework: 'jasmine',
            generateTestFiles: false,
            usePageObjects: false
        }

        await generateTestFiles(answers as any)

        expect(readDir).toBeCalledTimes(1)
        expect(ejs.renderFile).toBeCalledTimes(0)
    })

    it('Cucumber with page generation and no pageObjects', async () => {
        vi.mocked(readDir).mockResolvedValue([] as any)
        const answers = {
            specs: './tests/e2e/**/*.js',
            framework: 'cucumber',
            generateTestFiles: false,
            usePageObjects: false,
        }

        await generateTestFiles(answers as any)

        expect(readDir).toBeCalledTimes(1)
        expect(ejs.renderFile).toBeCalledTimes(0)
    })

    it('Cucumber without page objects', async () => {
        vi.mocked(readDir).mockResolvedValue([
            '/foo/bar/loo/step_definition/example.step.js',
            '/foo/bar/example.feature'
        ] as any)
        const answers = {
            specs: './tests/e2e/*.js',
            framework: 'cucumber',
            stepDefinitions: '/some/step/defs',
            usePageObjects: false,
            generateTestFiles: true,
            destSpecRootPath: '/tests/specs'
        }
        await generateTestFiles(answers as any)

        expect(readDir).toBeCalledTimes(1)
        expect(vi.mocked(readDir).mock.calls[0][0]).toContain('cucumber')
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
        expect(fs.mkdir).toBeCalledTimes(2)
    })

    it('Cucumber with page objects and TypeScript', async () => {
        vi.mocked(readDir).mockResolvedValue([
            '/foo/bar/loo/page.js.ejs',
            '/foo/bar/loo/step_definition/example.step.js',
            '/foo/bar/example.feature'
        ] as any)
        const answers = {
            framework: 'cucumber',
            usePageObjects: true,
            isUsingTypeScript: true,
            stepDefinitions: '/some/step',
            destSpecRootPath: '/tests/specs',
            destPageObjectRootPath: '/some/page/objects',
            relativePath: '../page/object'
        }
        await generateTestFiles(answers as any)

        expect(readDir).toBeCalledTimes(2)
        expect(vi.mocked(readDir).mock.calls[0][0]).toContain('cucumber')
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
        expect(fs.mkdir).toBeCalledTimes(6)
        expect(
            (vi.mocked(fs.writeFile).mock.calls[0][0] as string)
                .endsWith(`${path.sep}some${path.sep}page${path.sep}objects${path.sep}page.ts`)
        ).toBe(true)
        expect(
            (vi.mocked(fs.writeFile).mock.calls[2][0] as string)
                .endsWith(`${path.sep}example.feature`)
        ).toBe(true)
    })
})

describe('getPathForFileGeneration', () => {
    it('Cucumber with pageobjects default values', () => {
        const generatedPaths = getPathForFileGeneration({
            stepDefinitions: './features/step-definitions/steps.js',
            pages: './features/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$cucumber'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('../pageobjects')
    })

    it('Cucumber with pageobjects default different path', () => {
        const generatedPaths = getPathForFileGeneration({
            stepDefinitions: './features/step-definitions/steps.js',
            pages: './features/page/objects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$cucumber'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('../page/objects')
    })

    it('Mocha with pageobjects default values', () => {
        const generatedPaths = getPathForFileGeneration({
            specs: './test/specs/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$mocha'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('../pageobjects')
    })

    it('Mocha with pageobjects different path', () => {
        const generatedPaths = getPathForFileGeneration({
            specs: './test/specs/files/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$mocha'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('../../pageobjects')
    })

    it('Do not auto generate file', () => {
        const generatedPaths = getPathForFileGeneration({
            specs: './test/specs/files/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: false,
            usePageObjects: true,
            framework: '@wdio/cucumber-service$--$mocha'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('')
    })

    it('Do not use PageObjects', () => {
        const generatedPaths = getPathForFileGeneration({
            specs: './test/specs/files/**/*.js',
            pages: './test/pageobjects/**/*.js',
            generateTestFiles: true,
            usePageObjects: false,
            framework: '@wdio/cucumber-service$--$mocha'
        } as any, '/foo/bar')
        expect(generatedPaths.relativePath).toEqual('')
    })
})

test('getDefaultFiles', async () => {
    const files = '/foo/bar'
    expect(await getDefaultFiles({ projectRootCorrect: false, projectRoot: '/bar', isUsingCompiler: COMPILER_OPTION_ANSWERS[0] } as any, files))
        .toBe(path.join('/bar', 'foo', 'bar.js'))
    expect(await getDefaultFiles({ projectRootCorrect: false, projectRoot: '/bar', isUsingCompiler: COMPILER_OPTION_ANSWERS[1] } as any, files))
        .toBe(path.join('/bar', 'foo', 'bar.ts'))
    expect(await getDefaultFiles({ projectRootCorrect: false, projectRoot: '/bar', isUsingCompiler: COMPILER_OPTION_ANSWERS[2] } as any, files))
        .toBe(path.join('/bar', 'foo', 'bar.js'))
})

test('specifyVersionIfNeeded', () => {
    expect(specifyVersionIfNeeded(
        ['webdriverio', '@wdio/spec-reporter', 'wdio-chromedriver-service', 'wdio-geckodriver-service'],
        '8.0.0-alpha.249+4bc237701',
        'latest'
    )).toEqual([
        'webdriverio@^8.0.0-alpha.249',
        '@wdio/spec-reporter@^8.0.0-alpha.249',
        'wdio-chromedriver-service',
        'wdio-geckodriver-service'
    ])
})

test('getProjectRoot', () => {
    expect(getProjectRoot({ projectRoot: '/foo/bar' } as any)).toBe('/foo/bar')
    expect(getProjectRoot({} as any, { path: '/bar/foo' } as any)).toBe('/bar/foo')
    const projectDir = process.cwd().substring(process.cwd().lastIndexOf(path.sep) + 1)
    expect(getProjectRoot({} as any).includes(path.join(projectDir))).toBe(true)
})

test('hasBabelConfig', async () => {
    expect(await hasBabelConfig('/foo')).toBe(true)
    vi.mocked(fs.access).mockRejectedValue(new Error('not found'))
    expect(await hasBabelConfig('/foo')).toBe(false)
})

test('detectCompiler', async () => {
    vi.mocked(fs.access).mockResolvedValue({} as any)
    expect(await detectCompiler({} as any)).toBe(COMPILER_OPTIONS.babel)
    vi.mocked(fs.access).mockRejectedValue(new Error('not found'))
    expect(await detectCompiler({} as any)).toBe(COMPILER_OPTIONS.nil)
    vi.mocked(fs.access).mockImplementation((path) => {
        if (path.toString().includes('tsconfig')) {
            return Promise.resolve({} as any)
        }
        return Promise.reject(new Error('ouch'))
    })
    expect(await detectCompiler({} as any)).toBe(COMPILER_OPTIONS.ts)
})

test('getAnswers', async () => {
    let answers = await getAnswers(true)
    delete answers.pages // delete so it doesn't fail in Windows
    delete answers.specs // delete so it doesn't fail in Windows
    expect(answers).toMatchSnapshot()
    vi.mocked(inquirer.prompt).mockReturnValue('some value' as any)
    answers = await getAnswers(false)
    delete answers.pages // delete so it doesn't fail in Windows
    delete answers.specs // delete so it doesn't fail in Windows
    expect(answers).toBe('some value')
    expect(inquirer.prompt).toBeCalledTimes(1)
    // @ts-ignore
    expect(vi.mocked(inquirer.prompt).mock.calls[0][0][0].message)
        .toContain('A project named "cool-test-module" was detected')
    vi.mocked(readPackageUp).mockResolvedValue(undefined)
    vi.mocked(inquirer.prompt).mockClear()
    expect(await getAnswers(false)).toBe('some value')
    expect(inquirer.prompt).toBeCalledTimes(1)
    // @ts-ignore
    expect(vi.mocked(inquirer.prompt).mock.calls[0][0][0].message)
        .toContain('Couldn\'t find a package.json in')
})

test('getProjectProps', async () => {
    vi.mocked(readPackageUp).mockResolvedValue(undefined)
    expect(await getProjectProps('/foo/bar')).toBe(undefined)
    expect(readPackageUp).toBeCalledWith({ cwd: '/foo/bar' })
    vi.mocked(readPackageUp).mockResolvedValue({
        path: '/foo/bar',
        packageJson: {
            name: 'cool-test-module2',
        }
    })
    expect(await getProjectProps('/foo/bar')).toEqual({
        esmSupported: false,
        packageJson: { name: 'cool-test-module2' },
        path: '/foo'
    })
})

test('runProgram', () => {
    runProgram('foobar', [1, 2] as any, { foo: 'bar' } as any)
    expect(cp.spawn).toBeCalledWith('foobar', [1, 2], { foo: 'bar', stdio: 'inherit' })
})

test('createPackageJSON', async () => {
    await createPackageJSON({} as any)
    expect(fs.writeFile).toBeCalledTimes(0)
    await createPackageJSON({
        createPackageJSON: true,
        moduleSystem: 'foobar'
    } as any)
    expect(console.log).toBeCalledTimes(2)
    expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toContain('"type": "foobar"')
})

test('npmInstall', async () => {
    const parsedAnswers = {
        rawAnswers: {
            services: ['foo$--$bar'],
            preset: 'barfoo$--$vue'
        },
        isUsingTypeScript: true,
        framework: 'jasmine',
        installTestingLibrary: true,
        packagesToInstall: ['foo$--$bar', 'bar$--$foo'],
        npmInstall: true
    } as any
    await npmInstall(parsedAnswers, true, 'next')
    expect(yarnInstall).toBeCalledTimes(1)
    expect(vi.mocked(yarnInstall).mock.calls[0][0]).toMatchSnapshot()
})

test('not npmInstall', async () => {
    const parsedAnswers = {
        rawAnswers: {
            services: ['foo$--$bar'],
            preset: 'barfoo$--$vue'
        },
        installTestingLibrary: true,
        packagesToInstall: ['foo$--$bar', 'bar$--$foo'],
        npmInstall: false
    } as any
    await npmInstall(parsedAnswers, true, 'next')
    expect(yarnInstall).toBeCalledTimes(0)
    expect(vi.mocked(console.log).mock.calls[0][0]).toContain('To install dependencies, execute')
})

test('setupTypeScript', async () => {
    await setupTypeScript({} as any)
    expect(fs.writeFile).toBeCalledTimes(0)
    const parsedAnswers = {
        isUsingTypeScript: true,
        rawAnswers: {
            framework: 'foo',
            services: []
        },
        packagesToInstall: [],
        tsConfigFilePath: '/foobar/tsconfig.json'
    } as any
    await setupTypeScript(parsedAnswers)
    expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
    expect(parsedAnswers.packagesToInstall).toEqual(['ts-node', 'typescript'])
})

test('setup Babel', async () => {
    await setupBabel({} as any)
    expect(fs.writeFile).toBeCalledTimes(0)
    const parsedAnswers = {
        isUsingBabel: true,
        rawAnswers: {
            framework: 'foo',
            services: []
        },
        packagesToInstall: [],
        projectRootDir: '/foobar'
    } as any
    vi.mocked(fs.access).mockRejectedValue(new Error('foo'))
    await setupBabel(parsedAnswers)
    expect(vi.mocked(fs.writeFile).mock.calls[0][1]).toMatchSnapshot()
    expect(parsedAnswers.packagesToInstall).toEqual(
        ['@babel/register', '@babel/preset-env'])
})

test('createWDIOConfig', async () => {
    const answers = await parseAnswers(true)
    answers.projectRootDir = '/foo/bar'
    answers.destSpecRootPath = '/tests/specs'
    answers.destPageObjectRootPath = '/tests/specs'
    answers.stepDefinitions = './foo/bar'
    answers.specs = '/foo/bar/**'
    await createWDIOConfig(answers as any)
    expect(fs.writeFile).toBeCalledTimes(7)
    expect(
        vi.mocked(fs.writeFile).mock.calls[0][0]
            .toString()
            .endsWith(path.resolve('/foo/wdio.conf.js'))
    ).toBe(true)
})

describe('createWDIOScript', () => {
    it('can run with success', async () => {
        expect(await createWDIOScript({ wdioConfigPath: '/foo/bar/wdio.conf.js' } as any))
            .toBe(true)
        expect(cp.spawn).toBeCalledTimes(1)
    })

    it('does not fail the process if spawn errors out', async () => {
        vi.mocked(cp.spawn).mockReturnValue({ on: vi.fn().mockImplementation((ev, fn) => fn(1)) } as any)
        expect(await createWDIOScript({ wdioConfigPath: '/foo/bar/wdio.conf.js' } as any))
            .toBe(false)
        expect(cp.spawn).toBeCalledTimes(1)
    })
})

afterEach(() => {
    vi.mocked(inquirer.prompt).mockClear()
    vi.mocked(console.log).mockRestore()
    vi.mocked(readDir).mockClear()
    vi.mocked(fs.writeFile).mockClear()
    vi.mocked(cp.spawn).mockClear()
    vi.mocked(fs.mkdir).mockClear()
    vi.mocked(ejs.renderFile).mockClear()
    vi.mocked(yarnInstall).mockClear()
})
