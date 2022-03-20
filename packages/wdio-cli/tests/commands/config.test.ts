import fs from 'fs-extra'
import yargs from 'yargs'
import yarnInstall from 'yarn-install'
import inquirer from 'inquirer'
import pkg from '../../package.json'

import { handler, builder, missingConfigurationPrompt } from '../../src/commands/config'
import { addServiceDeps, convertPackageHashToObject, renderConfigurationFile, generateTestFiles, getPathForFileGeneration } from '../../src/utils'
import path from 'path'

jest.mock('../../src/utils', () => ({
    addServiceDeps: jest.fn(),
    convertPackageHashToObject: jest.fn().mockImplementation(jest.requireActual('../../src/utils').convertPackageHashToObject),
    renderConfigurationFile: jest.fn(),
    hasFile: jest.fn().mockReturnValue(false),
    hasPackage: jest.fn().mockReturnValue(false),
    getAnswers: jest.fn().mockImplementation(jest.requireActual('../../src/utils').getAnswers),
    generateTestFiles: jest.fn(),
    getPathForFileGeneration: jest.fn().mockImplementation(jest.requireActual('../../src/utils').getPathForFileGeneration),
}))

jest.mock('fs')

jest.mock('../../package.json', () => {
    const pkg = jest.requireActual('../../package.json')
    pkg.setFetchSpec = (fetchSpec: string) => {
        pkg._requested = { fetchSpec }
    }
    pkg.clearFetchSpec = () => {
        delete pkg._requested
    }
    return pkg
})

const errorLogSpy = jest.spyOn(console, 'error')
const consoleLogSpy = jest.spyOn(console, 'log')

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
    (yarnInstall as any as jest.Mock).mockClear()
    ;(yarnInstall as any as jest.Mock).mockReturnValue({ status: 0 })
    errorLogSpy.mockClear()
    consoleLogSpy.mockClear()

    delete process.env.WDIO_TEST_THROW_RESOLVE
})

afterEach(() => {
    errorLogSpy.mockReset()
})

test('should create config file', async () => {

    (inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve(args))
    // @ts-expect-error
    fs.promises = { writeFile: jest.fn()
        .mockReturnValue(Promise.resolve('')) }
    const result = await handler({} as any)
    delete result.parsedAnswers.destPageObjectRootPath
    delete result.parsedAnswers.destSpecRootPath
    const fileName = `${path.basename(path.dirname(result.parsedAnswers.tsConfigFilePath))}/${path.basename(result.parsedAnswers.tsConfigFilePath)}`
    result.parsedAnswers.tsConfigFilePath = fileName
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
    (renderConfigurationFile as jest.Mock).mockReturnValueOnce(Promise.reject(new Error('boom!')))
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
        setFetchSpec('beta');
        (inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve(args))
        // @ts-expect-error
        fs.promises = { writeFile: jest.fn()
            .mockReturnValue(Promise.resolve('')) }
        await handler({} as any)

        expect(consoleLogSpy.mock.calls).toMatchSnapshot()
    })

    test('it should install tagged version if cli is tagged with next', async () => {
        setFetchSpec('next');
        (inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve(args))
        // @ts-expect-error
        fs.promises = { writeFile: jest.fn()
            .mockReturnValue(Promise.resolve('')) }
        await handler({} as any)

        expect(consoleLogSpy.mock.calls).toMatchSnapshot()
    })

    test('it should install tagged version if cli is tagged with latest', async () => {
        setFetchSpec('latest');
        (inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve(args))
        // @ts-expect-error
        fs.promises = { writeFile: jest.fn()
            .mockReturnValue(Promise.resolve('')) }
        await handler({} as any)

        expect(consoleLogSpy.mock.calls).toMatchSnapshot()
    })

    test('it should not install tagged version if cli is tagged with a specific version', async () => {
        setFetchSpec('7.0.8');
        (inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve(args))
        // @ts-expect-error
        fs.promises = { writeFile: jest.fn()
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
    (inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve({
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
    }))
    await handler({} as any)
    expect(consoleLogSpy.mock.calls).toMatchSnapshot()
})

test('prints TypeScript setup message with ts-node installed', async () => {
    process.env.WDIO_TEST_THROW_RESOLVE = '1'
    ;(inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve({
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
    }))

    const config = {
        compilerOptions: {
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
    fs.promises = { writeFile: jest.fn()
        .mockReturnValue(Promise.resolve('')) }
    await handler({} as any)
    expect(consoleLogSpy.mock.calls).toMatchSnapshot()
})

test('should setup Babel if not existing', async () => {
    process.env.WDIO_TEST_THROW_RESOLVE = '1'
    ;(inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve({
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
    }))
    // @ts-expect-error
    fs.promises = { writeFile: jest.fn()
        .mockReturnValue(Promise.resolve('')) }
    await handler({} as any)
    expect(consoleLogSpy.mock.calls).toMatchSnapshot()
})

test('should not install @babel/register if existing', async () => {
    delete process.env.WDIO_TEST_THROW_RESOLVE
    ;(inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve({
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
    }))
    await handler({} as any)
    expect(consoleLogSpy.mock.calls).toMatchSnapshot()
})

test('should not install npm packages when npmInstall is false', async () => {
    const ans = { ...args, npmInstall: false };
    (inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve(ans))
    await handler({} as any)
    expect(consoleLogSpy).toMatchSnapshot()
    expect(yarnInstall).not.toHaveBeenCalled()
})

describe('missingConfigurationPromp', () => {
    it('should prompt user', async () => {
        (inquirer.prompt as any as jest.Mock).mockImplementation(() => ({ config: true }))
        await missingConfigurationPrompt('run', 'foobar', false, jest.fn())
        expect((inquirer.prompt as any as jest.Mock)).toHaveBeenCalled()
    })

    it('should call function to initalize configuration helper', async () => {
        const runConfig = jest.fn()
        await missingConfigurationPrompt('test', 'foobar', false, runConfig)
        expect(runConfig).toHaveBeenCalledWith(false, false, true)
    })

    it('should pass "yarn" flag to runConfig', async () => {
        const runConfig = jest.fn()
        await missingConfigurationPrompt('test', 'test message', true, runConfig)
        expect(runConfig).toHaveBeenCalledWith(true, false, true)
    })

    it('should throw if error occurs', async () => {
        const runConfig = jest.fn().mockImplementation(Promise.reject)

        try {
            await missingConfigurationPrompt('test', 'foobar', false, runConfig)
        } catch (error) {
            expect(error).toBeTruthy()
        }
    })

    afterEach(() => {
        (inquirer.prompt as any as jest.Mock).mockClear()
    })
})
