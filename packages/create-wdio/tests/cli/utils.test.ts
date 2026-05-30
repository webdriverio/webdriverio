import os from 'node:os'
import fs from 'node:fs/promises'
import { vi, test, expect, describe, beforeEach, it } from 'vitest'
import { canAccessConfigPath, missingConfigurationPrompt, parseAnswers, runConfigCommand } from '../../src/cli/utils.js'
import { createPackageJSON, npmInstall, createWDIOConfig, createWDIOScript, runAppiumInstaller, getAnswers } from '../../src/utils.js'
import { BackendChoice } from '../../src/constants.js'

import inquirer from 'inquirer'
import path from 'node:path'
import type { Questionnair } from '../../src/types.js'

vi.mock('node:fs/promises', async (orig) => ({
    ...(await orig()) as any,
    default: {
        access: vi.fn().mockRejectedValue('Yay')
    }
}))
vi.mock('inquirer')
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
        npmInstall: vi.fn(),
        createWDIOConfig: vi.fn(),
        createWDIOScript: vi.fn(),
        runAppiumInstaller: vi.fn()
    }
})

vi.mock('../src/install', () => ({
    installPackages: vi.fn(),
    getInstallCommand: vi.fn().mockReturnValue('npm install foo bar --save-dev')
}))
global.console.log = vi.fn()

const isUsingWindows = os.platform() === 'win32'

test('runConfigCommand', async () => {
    await runConfigCommand({ projectRootDir: '/foo/bar' } as any, 'next')
    expect(createPackageJSON).toBeCalledTimes(1)
    expect(npmInstall).toBeCalledTimes(1)
    expect(createWDIOConfig).toBeCalledTimes(1)
    expect(createWDIOScript).toBeCalledTimes(1)
    expect(runAppiumInstaller).toBeCalledTimes(1)
    expect(vi.mocked(console.log).mock.calls).toMatchSnapshot()
})

describe('canAccessConfigPath', () => {
    beforeEach(()=>{
        vi.mocked(fs.access).mockClear()
    })
    test('no extension only', async () => {
        vi.mocked(fs.access)
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValue('Yay' as any)
        expect(await canAccessConfigPath('/foo/bar')).toBe('/foo/bar.mts')
        expect(fs.access).not.toBeCalledWith('/foo/bar')
        expect(fs.access).toBeCalledWith('/foo/bar.js')
        expect(fs.access).toBeCalledWith('/foo/bar.ts')
        expect(fs.access).toBeCalledWith('/foo/bar.mjs')
        expect(fs.access).toBeCalledWith('/foo/bar.mts')
    })

    test('with full path of the existed file', async () => {
        vi.mocked(fs.access)
            .mockResolvedValue('Yay' as any)
        expect(await canAccessConfigPath('/foo/bar', '/foo/bar.ts')).toBe('/foo/bar.ts')
        expect(fs.access).toHaveBeenCalledTimes(1)
        expect(fs.access).toBeCalledWith('/foo/bar.ts')
    })

    test('with full path of the not existed file', async () => {
        vi.mocked(fs.access)
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValue('Yay' as any)
        expect(await canAccessConfigPath('/foo/bar', '/foo/bar.ts')).toBe('/foo/bar.mts')
        expect(fs.access).toBeCalledWith('/foo/bar.js')
        expect(fs.access).toBeCalledWith('/foo/bar.ts')
        expect(fs.access).toBeCalledWith('/foo/bar.mjs')
        expect(fs.access).toBeCalledWith('/foo/bar.mts')
    })
})
test('missingConfigurationPrompt does not init wizard if user does not want to', async () => {
    vi.mocked(getAnswers).mockResolvedValue({
        backend: BackendChoice.Local,
        generateTestFiles: false,
        baseUrl: 'http://localhost',
        runner: '@wdio/local-runner$--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        preset: '@sveltejs/vite-plugin-svelte$--$svelte',
        reporters: [],
        plugins: [],
        services: [],
        npmInstall: true
    } as any)
    const runConfigCmd = vi.fn()
    vi.mocked(inquirer.prompt).mockResolvedValue({})
    await missingConfigurationPrompt('config', 'foobar', runConfigCmd)
    expect(runConfigCmd).toBeCalledTimes(0)
})

test.skipIf(isUsingWindows)('parseAnswers', async () => {
    vi.mocked(getAnswers).mockResolvedValue({
        backend: BackendChoice.Local,
        specs: '/tmp/foobar/specs',
        pages: '/tmp/foobar/pageobjects',
        stepDefinitions: '/tmp/foobar/steps',
        generateTestFiles: true,
        usePageObjects: true,
        baseUrl: 'http://localhost',
        runner: '@wdio/local-runner$--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        preset: '@sveltejs/vite-plugin-svelte$--$svelte',
        isUsingTypeScript: false,
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
    } as any)
    const parsedAnswers = await parseAnswers(true)
    expect(parsedAnswers).toMatchSnapshot()
})

describe('Serenity/JS project generation', () => {

    const defaultAnswers: Questionnair = {
        runner: '@wdio/local-runner$--$local$--$e2e',
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
        isUsingTypeScript: false,
    } as any

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
                isUsingTypeScript: true,
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
                framework: '@serenity-js/webdriverio$--$@serenity-js/webdriverio$--$jasmine'
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
                isUsingTypeScript: true,
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
                isUsingTypeScript: true,
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

test('missingConfigurationPrompt does run config if user agrees', async () => {
    vi.mocked(getAnswers).mockResolvedValue({
        backend: BackendChoice.Local,
        generateTestFiles: false,
        baseUrl: 'http://localhost',
        runner: '@wdio/local-runner$--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        preset: '@sveltejs/vite-plugin-svelte$--$svelte',
        reporters: [],
        plugins: [],
        services: [],
        npmInstall: true
    } as any)
    const runConfigCmd = vi.fn()

    vi.mocked(inquirer.prompt).mockResolvedValue({ config: true })
    await missingConfigurationPrompt('config', 'foobar', runConfigCmd)
    expect(runConfigCmd).toBeCalledTimes(1)
})
