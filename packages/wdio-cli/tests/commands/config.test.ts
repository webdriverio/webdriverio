import { vi, describe, it, test, expect, afterEach, beforeEach } from 'vitest'
import path from 'node:path'
// @ts-expect-error mock
import { yargs } from 'yargs/yargs'
import fs from 'fs-extra'
import yarnInstall from 'yarn-install'
import inquirer from 'inquirer'
import pkg from '../../package.json'

import { handler, builder, missingConfigurationPrompt } from '../../src/commands/config'
import {
    getAnswers, addServiceDeps, convertPackageHashToObject, renderConfigurationFile,
    generateTestFiles, getPathForFileGeneration
} from '../../src/utils'

vi.mock('yargs/yargs')
vi.mock('yarn-install')
vi.mock('inquirer')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const utils: any = await vi.importActual('../../src/utils')
vi.mocked(convertPackageHashToObject).mockImplementation(utils.convertPackageHashToObject)
vi.mocked(getPathForFileGeneration).mockImplementation(utils.getPathForFileGeneration)
vi.mocked(getAnswers).mockImplementation(utils.getAnswers)

vi.mock('../../src/utils', async () => {
    return {
        addServiceDeps: vi.fn(),
        convertPackageHashToObject: vi.fn(),
        renderConfigurationFile: vi.fn(),
        hasFile: vi.fn().mockReturnValue(false),
        hasPackage: vi.fn().mockReturnValue(false),
        getAnswers: vi.fn(),
        generateTestFiles: vi.fn(),
        getPathForFileGeneration: vi.fn()
    }
})

vi.mock('fs', () => ({
    default: {
        writeFile: vi.fn().mockResolvedValue(''),
        existsSync: vi.fn()
    }
}))

vi.mock('../../package.json', async () => {
    const pkg = await vi.importActual('../../package.json') as any
    pkg.setFetchSpec = (fetchSpec: string) => {
        pkg._requested = { fetchSpec }
    }
    pkg.clearFetchSpec = () => {
        delete pkg._requested
    }
    return { default: pkg }
})

const errorLogSpy = vi.spyOn(console, 'error')
const consoleLogSpy = vi.spyOn(console, 'log')

const args = {
    framework: '@wdio/mocha-framework$--$mocha',
    reporters: [
        '@wdio/spec-reporter$--$spec'
    ],
    plugins: [
        'wdio-wait-for$--$wait-for'
    ],
    services: [
        '@wdio/sauce-service$--$sauce'
    ],
    isUsingTypeScript: false,
    npmInstall: true
}

beforeEach(() => {
    vi.mocked(yarnInstall).mockClear()
    vi.mocked(yarnInstall).mockReturnValue({ status: 0 } as any)
    errorLogSpy.mockClear()
    consoleLogSpy.mockClear()

    delete process.env.WDIO_TEST_THROW_RESOLVE
})

afterEach(() => {
    errorLogSpy.mockReset()
})

test('should create config file', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue(args)
    const result = await handler({} as any)
    // @ts-expect-error
    delete result.parsedAnswers.destPageObjectRootPath
    // @ts-expect-error
    delete result.parsedAnswers.destSpecRootPath
    const fileName = `${path.basename(path.dirname(result.parsedAnswers!.tsConfigFilePath))}/${path.basename(result.parsedAnswers!.tsConfigFilePath)}`
    result.parsedAnswers!.tsConfigFilePath = fileName
    expect(result).toMatchSnapshot()
    expect(addServiceDeps).toBeCalledTimes(1)
    expect(convertPackageHashToObject).toBeCalledTimes(5)
    expect(renderConfigurationFile).toBeCalledTimes(1)
    expect(generateTestFiles).toBeCalledTimes(0)
    expect(getPathForFileGeneration).toBeCalledTimes(1)
    expect(errorLogSpy).toHaveBeenCalledTimes(0)
    expect(yarnInstall).toHaveBeenCalledWith({
        deps: expect.any(Object),
        dev: true,
        respectNpm5: true
    })
})

test('it should properly build command', () => {
    builder(yargs)
    expect(yargs.options).toHaveBeenCalled()
    expect(yargs.epilogue).toHaveBeenCalled()
    expect(yargs.help).toHaveBeenCalled()
})

test('should throw error if creating config file fails', async () => {
    vi.mocked(renderConfigurationFile).mockReturnValueOnce(Promise.reject(new Error('boom!')))
    const err = await handler({} as any).catch((err) => err)
    expect(err.message).toContain('Error: boom!')
})

test('it should install with yarn when flag is passed', async () => {
    await handler({ yarn: true, yes: false } as any)

    expect(yarnInstall).toHaveBeenCalledWith({
        deps: expect.any(Object),
        dev: true,
        respectNpm5: false
    })
})

describe('install compliant NPM tag packages', () => {
    // @ts-expect-error
    const setFetchSpec = (fetchSpec) => pkg.setFetchSpec(fetchSpec)
    const args = {
        framework: '@wdio/mocha-framework$--$mocha',
        reporters: [],
        plugins: [],
        services: [
            '@wdio/crossbrowsertesting-service$--$crossbrowsertesting',
            'wdio-lambdatest-service$--$lambdatest'
        ],
        generateTestFiles: false,
        isUsingCompiler: 'TypeScript (https://www.typescriptlang.org/)',
        npmInstall: true
    }

    test('it should install tagged version if cli is tagged with beta', async () => {
        setFetchSpec('beta')
        vi.mocked(inquirer.prompt).mockResolvedValue(args)
        // @ts-expect-error
        fs.promises = { writeFile: vi.fn()
            .mockReturnValue(Promise.resolve('')) }
        await handler({} as any)

        expect(consoleLogSpy.mock.calls).toMatchSnapshot()
    })

    test('it should install tagged version if cli is tagged with next', async () => {
        setFetchSpec('next')
        vi.mocked(inquirer.prompt).mockResolvedValue(args)
        fs.promises = {
            writeFile: vi.fn().mockReturnValue(Promise.resolve(''))
        } as any
        await handler({} as any)

        expect(consoleLogSpy.mock.calls).toMatchSnapshot()
    })

    test('it should install tagged version if cli is tagged with latest', async () => {
        setFetchSpec('latest')
        vi.mocked(inquirer.prompt).mockResolvedValue(args)
        // @ts-expect-error
        fs.promises = { writeFile: vi.fn()
            .mockReturnValue(Promise.resolve('')) }
        await handler({} as any)

        expect(consoleLogSpy.mock.calls).toMatchSnapshot()
    })

    test('it should not install tagged version if cli is tagged with a specific version', async () => {
        setFetchSpec('7.0.8')
        vi.mocked(inquirer.prompt).mockResolvedValue(args)
        // @ts-expect-error
        fs.promises = { writeFile: vi.fn()
            .mockReturnValue(Promise.resolve('')) }
        await handler({} as any)

        expect(consoleLogSpy.mock.calls).toMatchSnapshot()
    })

    afterEach(() => {
        // @ts-expect-error
        pkg.clearFetchSpec()
    })
})

test('prints TypeScript setup message', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
        framework: '@wdio/mocha-framework$--$mocha',
        reporters: [],
        plugins: [],
        services: [
            '@wdio/crossbrowsertesting-service$--$crossbrowsertesting',
            'wdio-lambdatest-service$--$lambdatest'
        ],
        generateTestFiles: false,
        isUsingCompiler: 'TypeScript (https://www.typescriptlang.org/)',
        npmInstall: true
    })
    await handler({} as any)
    expect(consoleLogSpy.mock.calls).toMatchSnapshot()
})

test('prints TypeScript setup message with ts-node installed', async () => {
    process.env.WDIO_TEST_THROW_RESOLVE = '1'
    vi.mocked(inquirer.prompt).mockResolvedValue({
        framework: '@wdio/mocha-framework$--$mocha',
        reporters: [],
        plugins: [],
        services: [
            '@wdio/crossbrowsertesting-service$--$crossbrowsertesting',
            'wdio-lambdatest-service$--$lambdatest'
        ],
        generateTestFiles: false,
        isUsingCompiler: 'TypeScript (https://www.typescriptlang.org/)',
        npmInstall: true
    })

    const config = {
        compilerOptions: {
            moduleResolution: 'node',
            types: [
                'node',
                'webdriverio/async',
                '@wdio/mocha-framework',
                'expect-webdriverio'
            ],
            target: 'es2019',
        }
    }

    expect(fs.promises.writeFile).toBeCalledWith(
        path.join(process.cwd(), 'test', 'tsconfig.json'),
        JSON.stringify(config, null, 4))

    // @ts-expect-error
    fs.promises = { writeFile: vi.fn()
        .mockReturnValue(Promise.resolve('')) }
    await handler({} as any)
    expect(consoleLogSpy.mock.calls).toMatchSnapshot()
})

test('should setup Babel if not existing', async () => {
    process.env.WDIO_TEST_THROW_RESOLVE = '1'
    vi.mocked(inquirer.prompt).mockResolvedValue({
        framework: '@wdio/mocha-framework$--$mocha',
        reporters: [],
        plugins: [],
        services: [
            '@wdio/crossbrowsertesting-service$--$crossbrowsertesting',
            'wdio-lambdatest-service$--$lambdatest'
        ],
        generateTestFiles: false,
        isUsingCompiler: 'Babel (https://babeljs.io/)',
        npmInstall: true
    })
    // @ts-expect-error
    fs.promises = { writeFile: vi.fn()
        .mockReturnValue(Promise.resolve('')) }
    await handler({} as any)
    expect(consoleLogSpy.mock.calls).toMatchSnapshot()
})

test('should not install @babel/register if existing', async () => {
    delete process.env.WDIO_TEST_THROW_RESOLVE
    vi.mocked(inquirer.prompt).mockResolvedValue({
        framework: '@wdio/mocha-framework$--$mocha',
        reporters: [],
        plugins: [],
        services: [
            '@wdio/crossbrowsertesting-service$--$crossbrowsertesting',
            'wdio-lambdatest-service$--$lambdatest'
        ],
        generateTestFiles: false,
        isUsingCompiler: 'Babel (https://babeljs.io/)',
        npmInstall: true
    })
    await handler({} as any)
    expect(consoleLogSpy.mock.calls).toMatchSnapshot()
})

test('should not install npm packages when npmInstall is false', async () => {
    const ans = { ...args, npmInstall: false }
    vi.mocked(inquirer.prompt).mockResolvedValue(ans)
    await handler({} as any)
    expect(consoleLogSpy).toMatchSnapshot()
    expect(yarnInstall).not.toHaveBeenCalled()
})

describe('missingConfigurationPromp', () => {
    it('should prompt user', async () => {
        vi.mocked(inquirer.prompt).mockImplementation(() => ({ config: true }) as any)
        await missingConfigurationPrompt('run', 'foobar', false, vi.fn())
        expect(vi.mocked(inquirer.prompt)).toHaveBeenCalled()
    })

    it('should call function to initalize configuration helper', async () => {
        const runConfig = vi.fn()
        await missingConfigurationPrompt('test', 'foobar', false, runConfig)
        expect(runConfig).toHaveBeenCalledWith(false, false, true)
    })

    it('should pass "yarn" flag to runConfig', async () => {
        const runConfig = vi.fn()
        await missingConfigurationPrompt('test', 'test message', true, runConfig)
        expect(runConfig).toHaveBeenCalledWith(true, false, true)
    })

    it('should throw if error occurs', async () => {
        const runConfig = vi.fn().mockImplementation(Promise.reject)

        try {
            await missingConfigurationPrompt('test', 'foobar', false, runConfig)
        } catch (error) {
            expect(error).toBeTruthy()
        }
    })

    afterEach(() => {
        vi.mocked(inquirer.prompt).mockClear()
    })
})
