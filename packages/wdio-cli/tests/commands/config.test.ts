import os from 'node:os'
import path from 'node:path'
import { vi, test, expect, afterEach, beforeEach } from 'vitest'
import inquirer from 'inquirer'

import { handler, builder, parseAnswers, missingConfigurationPrompt, runConfigCommand } from '../../src/commands/config.js'
import {
    getAnswers, createPackageJSON, setupTypeScript, setupBabel, npmInstall, createWDIOConfig, createWDIOScript
} from '../../src/utils.js'

const consoleLog = console.log.bind(console)
beforeEach(() => {
    console.log = vi.fn()
})
afterEach(() => {
    console.log = consoleLog
})

vi.mock('inquirer')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../src/utils.js', () => ({
    convertPackageHashToObject: vi.fn((param) => ({ short: param })),
    getAnswers: vi.fn(),
    getPathForFileGeneration: vi.fn().mockReturnValue({}),
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
    createWDIOScript: vi.fn()
}))

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

test('parseAnswers', async () => {
    // skip for Windows
    if (os.platform() === 'win32') {
        return
    }

    vi.mocked(getAnswers).mockResolvedValue({
        backend: 'On my local machine',
        specs: '/tmp/foobar/specs',
        pages: '/tmp/foobar/pageobjects',
        generateTestFiles: true,
        usePageObjects: true,
        isUsingCompiler: 'TypeScript (https://www.typescriptlang.org/)',
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
    await runConfigCommand({ projectRootDir: '/foo/bar' } as any, true, 'next')
    expect(createPackageJSON).toBeCalledTimes(1)
    expect(setupTypeScript).toBeCalledTimes(1)
    expect(setupBabel).toBeCalledTimes(1)
    expect(npmInstall).toBeCalledTimes(1)
    expect(createWDIOConfig).toBeCalledTimes(1)
    expect(createWDIOScript).toBeCalledTimes(1)
    expect(vi.mocked(console.log).mock.calls).toMatchSnapshot()
})

test('handler', async () => {
    // skip for Windows
    if (os.platform() === 'win32') {
        return
    }
    vi.mocked(getAnswers).mockResolvedValue({
        backend: 'On my local machine',
        generateTestFiles: false,
        isUsingCompiler: 'TypeScript (https://www.typescriptlang.org/)',
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
        backend: 'On my local machine',
        generateTestFiles: false,
        isUsingCompiler: 'TypeScript (https://www.typescriptlang.org/)',
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
    await missingConfigurationPrompt('config', 'foobar', true, runConfigCmd)
    expect(runConfigCmd).toBeCalledTimes(0)
})

test('missingConfigurationPrompt does run config if user agrees', async () => {
    vi.mocked(getAnswers).mockResolvedValue({
        backend: 'On my local machine',
        generateTestFiles: false,
        isUsingCompiler: 'TypeScript (https://www.typescriptlang.org/)',
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
    await missingConfigurationPrompt('config', 'foobar', true, runConfigCmd)
    expect(runConfigCmd).toBeCalledTimes(1)
})
