import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import {
    builder,
    handler,
} from '../../src/cli/config.js'
import {
    getAnswers,
} from '../../src/utils.js'
import { BackendChoice } from '../../src/constants.js'

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
    yargs.example = vi.fn().mockReturnValue(yargs)
    yargs.help = vi.fn().mockReturnValue(yargs)
    builder(yargs)
    expect(yargs.options).toBeCalledTimes(1)
    expect(yargs.options).toBeCalledWith(expect.objectContaining({
        yes: expect.any(Object),
        framework: expect.objectContaining({ group: 'Wizard answers:' }),
        'npm-install': expect.objectContaining({ type: 'boolean' })
    }))
    expect(yargs.epilogue).toBeCalledTimes(1)
    expect(yargs.help).toBeCalledTimes(1)
})

test.skipIf(isUsingWindows)('handler', async () => {
    vi.mocked(getAnswers).mockResolvedValue({
        backend: BackendChoice.Local,
        generateTestFiles: false,
        baseUrl: 'http://localhost',
        runner: '@wdio/local-runner$--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        preset: '@sveltejs/vite-plugin-svelte$--$svelte',
        isUsingTypeScript: true,
        reporters: [],
        plugins: [],
        services: [],
        npmInstall: true
    } as any)
    const runConfigCmd = vi.fn()
    expect(await handler({} as any, runConfigCmd)).toMatchSnapshot()
    expect(runConfigCmd).toBeCalledTimes(1)
})

test('handler passes flag answers to the wizard', async () => {
    vi.mocked(getAnswers).mockResolvedValue({
        runner: '@wdio/local-runner$--$local',
        framework: '@wdio/jasmine-framework$--$jasmine',
        isUsingTypeScript: false,
        reporters: [],
        plugins: [],
        services: []
    } as any)
    await handler({ yes: true, framework: 'jasmine', typescript: false } as any, vi.fn())
    expect(getAnswers).toBeCalledWith(true, {
        framework: '@wdio/jasmine-framework$--$jasmine',
        isUsingTypeScript: false
    })
})

test('handler exits with code 2 on an invalid flag', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any)
    const runConfigCmd = vi.fn()
    await handler({ framework: 'cucumbr' } as any, runConfigCmd)
    expect(consoleError).toBeCalledWith(expect.stringContaining('Invalid value "cucumbr" for --framework'))
    expect(exit).toBeCalledWith(2)
    expect(runConfigCmd).toBeCalledTimes(0)
    consoleError.mockRestore()
    exit.mockRestore()
})
