import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'

import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import inquirer from 'inquirer'

import {
    builder,
    canAccessConfigPath,
    handler,
    missingConfigurationPrompt,
    parseAnswers,
    runConfigCommand,
} from '../../src/commands/config.js'
import {
    createPackageJSON,
    createWDIOConfig,
    createWDIOScript,
    getAnswers,
    npmInstall,
    runAppiumInstaller,
    setupBabel,
    setupTypeScript,
} from '../../src/utils.js'
import { BackendChoice, CompilerOptions } from '../../src/constants.js'
import type { Questionnair } from '../../build/types'

const consoleLog = console.log.bind(console)
beforeEach(() => {
    console.log = vi.fn()
})
afterEach(() => {
    console.log = consoleLog
})

const isUsingWindows = os.platform() === 'win32'

process.cwd = () => '/foo/bar'

vi.mock('node:fs/promises', async (orig) => ({
    ...(await orig()) as any,
    default: {
        access: vi.fn().mockRejectedValue('Yay')
    }
}))
vi.mock('inquirer')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../src/utils.js', async () => {
    const actual = await vi.importActual('../../src/utils.js') as Promise<object>
    return {
        ...actual,
        getAnswers: vi.fn(),
        getProjectProps: vi.fn().mockResolvedValue({
            path: '/foo/bar',
            esmSupported: true,
            packageJson: {
                name: 'my-module'
            }
        }),
        getProjectRoot: vi.fn().mockReturnValue('/foo/bar'),
        createPackageJSON: vi.fn(),
        setupTypeScript: vi.fn(),
        setupBabel: vi.fn(),
        npmInstall: vi.fn(),
        createWDIOConfig: vi.fn(),
        createWDIOScript: vi.fn(),
        runAppiumInstaller: vi.fn()
    }
})

test('builder', () => {
    const yargs = {} as any
    yargs.options = vi.fn().mockReturnValue(yargs)
    yargs.epilogue = vi.fn().mockReturnValue(yargs)
    yargs.help = vi.fn().mockReturnValue(yargs)
    builder(yargs)
    expect(yargs.options).toBeCalledTimes(1)
    expect(yargs.options).toBeCalledWith(expect.any(Object))
    expect(yargs.epilogue).toBeCalledTimes(1)
    expect(yargs.help).toBeCalledTimes(1)
})

test.skipIf(isUsingWindows)('parseAnswers', async () => {
    vi.mocked(getAnswers).mockResolvedValue({
        backend: BackendChoice.Local,
        specs: '/tmp/foobar/specs',
        pages: '/tmp/foobar/pageobjects',
        generateTestFiles: true,
        usePageObjects: true,
        isUsingCompiler: CompilerOptions.TS,
        baseUrl: 'http://localhost',
        runner: '@wdio/local-runner$--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        preset: '@sveltejs/vite-plugin-svelte$--$svelte',
        reporters: [
            '@wdio/spec-reporter$--$spec'
        ],
        plugins: [
            'wdio-wait-for$--$wait-for'
        ],
        services: [
            '@wdio/sauce-service$--$sauce'
        ],
        npmInstall: true
    })
    const parsedAnswers = await parseAnswers(true)
    expect(parsedAnswers).toMatchSnapshot()
})

test('runConfigCommand', async () => {
    await runConfigCommand({ projectRootDir: '/foo/bar' } as any, 'next')
    expect(createPackageJSON).toBeCalledTimes(1)
    expect(setupTypeScript).toBeCalledTimes(1)
    expect(setupBabel).toBeCalledTimes(1)
    expect(npmInstall).toBeCalledTimes(1)
    expect(createWDIOConfig).toBeCalledTimes(1)
    expect(createWDIOScript).toBeCalledTimes(1)
    expect(runAppiumInstaller).toBeCalledTimes(1)
    expect(vi.mocked(console.log).mock.calls).toMatchSnapshot()
})

test.skipIf(isUsingWindows)('handler', async () => {
    vi.mocked(getAnswers).mockResolvedValue({
        backend: BackendChoice.Local,
        generateTestFiles: false,
        isUsingCompiler: CompilerOptions.TS,
        baseUrl: 'http://localhost',
        runner: '@wdio/local-runner$--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        preset: '@sveltejs/vite-plugin-svelte$--$svelte',
        reporters: [],
        plugins: [],
        services: [],
        npmInstall: true
    })
    const runConfigCmd = vi.fn()
    expect(await handler({} as any, runConfigCmd)).toMatchSnapshot()
    expect(runConfigCmd).toBeCalledTimes(1)
})

test('missingConfigurationPrompt does not init wizard if user does not want to', async () => {
    vi.mocked(getAnswers).mockResolvedValue({
        backend: BackendChoice.Local,
        generateTestFiles: false,
        isUsingCompiler: CompilerOptions.TS,
        baseUrl: 'http://localhost',
        runner: '@wdio/local-runner$--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        preset: '@sveltejs/vite-plugin-svelte$--$svelte',
        reporters: [],
        plugins: [],
        services: [],
        npmInstall: true
    })
    const runConfigCmd = vi.fn()
    vi.mocked(inquirer.prompt).mockResolvedValue({})
    await missingConfigurationPrompt('config', 'foobar', runConfigCmd)
    expect(runConfigCmd).toBeCalledTimes(0)
})

test('missingConfigurationPrompt does run config if user agrees', async () => {
    vi.mocked(getAnswers).mockResolvedValue({
        backend: BackendChoice.Local,
        generateTestFiles: false,
        isUsingCompiler: CompilerOptions.TS,
        baseUrl: 'http://localhost',
        runner: '@wdio/local-runner$--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        preset: '@sveltejs/vite-plugin-svelte$--$svelte',
        reporters: [],
        plugins: [],
        services: [],
        npmInstall: true
    })
    const runConfigCmd = vi.fn()

    vi.mocked(inquirer.prompt).mockResolvedValue({ config: true })
    await missingConfigurationPrompt('config', 'foobar', runConfigCmd)
    expect(runConfigCmd).toBeCalledTimes(1)
})

test('canAccessConfigPath', async () => {
    vi.mocked(fs.access)
        .mockRejectedValueOnce(new Error('not found'))
        .mockRejectedValueOnce(new Error('not found'))
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValue('Yay' as any)
    expect(await canAccessConfigPath('/foo/bar')).toBe('/foo/bar.mts')
    expect(fs.access).toBeCalledWith('/foo/bar.js')
    expect(fs.access).toBeCalledWith('/foo/bar.ts')
    expect(fs.access).toBeCalledWith('/foo/bar.mjs')
    expect(fs.access).toBeCalledWith('/foo/bar.mts')
})

describe('Serenity/JS project generation', () => {

    const defaultAnswers: Questionnair = {
        runner: '@wdio/local-runner$--$local$--$e2e',
        // @ts-expect-error
        framework: undefined,   // overridden in the tests
        backend: BackendChoice.Local,
        e2eEnvironment: 'web',
        browserEnvironment: ['chrome'],
        specs: '/foo/bar/specs',
        pages: '/foo/bar/pageobjects',
        generateTestFiles: true,
        usePageObjects: true,
        baseUrl: 'http://localhost',
        reporters: [],
        plugins: [],
        services: [],
        npmInstall: true,
        isUsingCompiler: CompilerOptions.Nil,
    }

    it('marks serenityAdapter as false and destSerenityLibRootPath as blank if not using Serenity/JS', async () => {
        vi.mocked(getAnswers).mockResolvedValue({
            ...defaultAnswers,
            framework: '@wdio/mocha-framework$--$mocha',
        })
        const parsedAnswers = await parseAnswers(true)

        expect(parsedAnswers.framework).toEqual('mocha')
        expect(parsedAnswers.serenityAdapter).toEqual(false)
        expect(parsedAnswers.destSerenityLibRootPath).toEqual('')
    })

    it('adds projectName so that it can be used in templates', async () => {
        vi.mocked(getAnswers).mockResolvedValue({
            ...defaultAnswers,
            framework: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$mocha',
            serenityLibPath: './serenity',
        })
        const parsedAnswers = await parseAnswers(true)

        expect(parsedAnswers.projectName).toEqual('my-module')
    })

    describe('serenityLibPath', () => {

        it('supports a relative path', async () => {
            vi.mocked(getAnswers).mockResolvedValue({
                ...defaultAnswers,
                framework: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$mocha',
                serenityLibPath: './serenity',
            })
            const parsedAnswers = await parseAnswers(true)

            expect(parsedAnswers.destSerenityLibRootPath.split(path.sep))
                .toEqual(expect.arrayContaining(['foo', 'bar', 'serenity']))
        })

        it('supports an absolute path', async () => {
            vi.mocked(getAnswers).mockResolvedValue({
                ...defaultAnswers,
                framework: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$mocha',
                serenityLibPath: '/foo/bar/src/serenity',
            })
            const parsedAnswers = await parseAnswers(true)

            expect(parsedAnswers.destSerenityLibRootPath.split(path.sep))
                .toEqual(expect.arrayContaining(['foo', 'bar', 'src', 'serenity']))
        })
    })

    describe('with Cucumber', () => {

        it('adds necessary packages', async () => {
            vi.mocked(getAnswers).mockResolvedValue({
                ...defaultAnswers,
                framework: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$cucumber',
                specs: 'features/**/*.feature',
                stepDefinitions: 'features/step-definitions/steps'
            })
            const parsedAnswers = await parseAnswers(true)

            expect(parsedAnswers.framework).toEqual('@serenity-js/webdriverio')
            expect(parsedAnswers.serenityAdapter).toEqual('cucumber')
            expect(parsedAnswers.destSpecRootPath.split(path.sep)).toEqual(expect.arrayContaining(['foo', 'bar', 'features']))
            expect(parsedAnswers.packagesToInstall).toEqual([
                '@wdio/local-runner',
                '@serenity-js/webdriverio',
                '@cucumber/cucumber',
                '@serenity-js/assertions',
                '@serenity-js/console-reporter',
                '@serenity-js/core',
                '@serenity-js/cucumber',
                '@serenity-js/rest',
                '@serenity-js/serenity-bdd',
                '@serenity-js/web',
                'npm-failsafe',
                'rimraf',
            ])
        })

        it('supports TypeScript projects', async () => {
            vi.mocked(getAnswers).mockResolvedValue({
                ...defaultAnswers,
                framework: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$cucumber',
                specs: 'features/**/*.feature',
                stepDefinitions: 'features/step-definitions/steps',
                isUsingCompiler: CompilerOptions.TS,
            })
            const parsedAnswers = await parseAnswers(true)

            expect(parsedAnswers.framework).toEqual('@serenity-js/webdriverio')
            expect(parsedAnswers.serenityAdapter).toEqual('cucumber')
            expect(parsedAnswers.packagesToInstall).toEqual([
                '@wdio/local-runner',
                '@serenity-js/webdriverio',
                '@cucumber/cucumber',
                '@serenity-js/assertions',
                '@serenity-js/console-reporter',
                '@serenity-js/core',
                '@serenity-js/cucumber',
                '@serenity-js/rest',
                '@serenity-js/serenity-bdd',
                '@serenity-js/web',
                '@types/node',
                'npm-failsafe',
                'rimraf',
            ])
        })
    })

    describe('with Jasmine', () => {
        it('adds necessary packages', async () => {
            vi.mocked(getAnswers).mockResolvedValue({
                ...defaultAnswers,
                framework: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$jasmine',
            })
            const parsedAnswers = await parseAnswers(true)

            expect(parsedAnswers.framework).toEqual('@serenity-js/webdriverio')
            expect(parsedAnswers.serenityAdapter).toEqual('jasmine')
            expect(parsedAnswers.packagesToInstall).toEqual([
                '@wdio/local-runner',
                '@serenity-js/webdriverio',
                '@serenity-js/assertions',
                '@serenity-js/console-reporter',
                '@serenity-js/core',
                '@serenity-js/jasmine',
                '@serenity-js/rest',
                '@serenity-js/serenity-bdd',
                '@serenity-js/web',
                'jasmine',
                'npm-failsafe',
                'rimraf',
            ])
        })

        it('supports TypeScript projects', async () => {
            vi.mocked(getAnswers).mockResolvedValue({
                ...defaultAnswers,
                framework: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$jasmine',
                isUsingCompiler: CompilerOptions.TS,
            })
            const parsedAnswers = await parseAnswers(true)

            expect(parsedAnswers.framework).toEqual('@serenity-js/webdriverio')
            expect(parsedAnswers.serenityAdapter).toEqual('jasmine')
            expect(parsedAnswers.packagesToInstall).toEqual([
                '@wdio/local-runner',
                '@serenity-js/webdriverio',
                '@serenity-js/assertions',
                '@serenity-js/console-reporter',
                '@serenity-js/core',
                '@serenity-js/jasmine',
                '@serenity-js/rest',
                '@serenity-js/serenity-bdd',
                '@serenity-js/web',
                '@types/jasmine',
                '@types/node',
                'jasmine',
                'npm-failsafe',
                'rimraf',
            ])
        })
    })

    describe('with Mocha', () => {

        it('adds necessary packages', async () => {
            vi.mocked(getAnswers).mockResolvedValue({
                ...defaultAnswers,
                framework: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$mocha',
                serenityLibPath: './serenity',
            })
            const parsedAnswers = await parseAnswers(true)

            expect(parsedAnswers.framework).toEqual('@serenity-js/webdriverio')
            expect(parsedAnswers.serenityAdapter).toEqual('mocha')
            expect(parsedAnswers.packagesToInstall).toEqual([
                '@wdio/local-runner',
                '@serenity-js/webdriverio',
                '@serenity-js/assertions',
                '@serenity-js/console-reporter',
                '@serenity-js/core',
                '@serenity-js/mocha',
                '@serenity-js/rest',
                '@serenity-js/serenity-bdd',
                '@serenity-js/web',
                'mocha',
                'npm-failsafe',
                'rimraf',
            ])
        })

        it('supports TypeScript projects', async () => {
            vi.mocked(getAnswers).mockResolvedValue({
                ...defaultAnswers,
                framework: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$mocha',
                serenityLibPath: './serenity',
                isUsingCompiler: CompilerOptions.TS,
            })
            const parsedAnswers = await parseAnswers(true)

            expect(parsedAnswers.framework).toEqual('@serenity-js/webdriverio')
            expect(parsedAnswers.serenityAdapter).toEqual('mocha')
            expect(parsedAnswers.packagesToInstall).toEqual([
                '@wdio/local-runner',
                '@serenity-js/webdriverio',
                '@serenity-js/assertions',
                '@serenity-js/console-reporter',
                '@serenity-js/core',
                '@serenity-js/mocha',
                '@serenity-js/rest',
                '@serenity-js/serenity-bdd',
                '@serenity-js/web',
                '@types/mocha',
                '@types/node',
                'mocha',
                'npm-failsafe',
                'rimraf',
            ])
        })
    })
})
