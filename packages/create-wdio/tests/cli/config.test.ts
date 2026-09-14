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
    yargs.help = vi.fn().mockReturnValue(yargs)
    builder(yargs)
    expect(yargs.options).toBeCalledTimes(1)
    expect(yargs.options).toBeCalledWith(expect.any(Object))
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
