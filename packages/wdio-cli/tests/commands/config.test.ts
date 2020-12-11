import yargs from 'yargs'
import yarnInstall from 'yarn-install'
import inquirer from 'inquirer'

import { handler, builder, missingConfigurationPrompt } from '../../src/commands/config'
import { addServiceDeps, convertPackageHashToObject, renderConfigurationFile, generateTestFiles, getPathForFileGeneration } from '../../src/utils'

jest.mock('../../src/utils', () => ({
    addServiceDeps: jest.fn(),
    convertPackageHashToObject: jest.fn().mockReturnValue('foobar'),
    renderConfigurationFile: jest.fn(),
    hasFile: jest.fn().mockReturnValue(false),
    getAnswers: jest.fn().mockImplementation(jest.requireActual('../../src/utils').getAnswers),
    generateTestFiles: jest.fn(),
    getPathForFileGeneration: jest.fn().mockImplementation(jest.requireActual('../../src/utils').getPathForFileGeneration),
}))

const errorLogSpy = jest.spyOn(console, 'error')
const consoleLogSpy = jest.spyOn(console, 'log')
beforeEach(() => {
    (yarnInstall as any as jest.Mock).mockClear()
    ;(yarnInstall as any as jest.Mock).mockReturnValue({ status: 0 })
    errorLogSpy.mockClear()
    consoleLogSpy.mockClear()
})

afterEach(() => {
    errorLogSpy.mockReset()
})

test('should create config file', async () => {
    await handler({} as any)
    expect(addServiceDeps).toBeCalledTimes(1)
    expect(convertPackageHashToObject).toBeCalledTimes(4)
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

test('should log error if creating config file fails', async () => {
    (renderConfigurationFile as jest.Mock).mockReturnValueOnce(Promise.reject(new Error('boom!')))
    await handler({} as any)
    expect(errorLogSpy).toHaveBeenCalledTimes(1)
})

test('installs @wdio/sync if user requests to run in sync mode', async () => {
    (inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve({
        executionMode: 'sync',
        runner: '@wdio/local-runner--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        generateTestFiles: true,
        reporters: [],
        services: []
    }))
    await handler({} as any)
    expect(generateTestFiles).toBeCalledTimes(1)
    expect(yarnInstall).toHaveBeenCalledWith({
        deps: ['@wdio/local-runner', undefined, '@wdio/sync'],
        dev: true,
        respectNpm5: true
    })
})

test('it should install with yarn when flag is passed', async () => {
    await handler({ yarn: true, yes: false } as any)

    expect(yarnInstall).toHaveBeenCalledWith({
        deps: expect.any(Object),
        dev: true,
        respectNpm5: false
    })
})

test('should throw an error if something goes wrong', async () => {
    // @ts-ignore uses expect-webdriverio
    expect.assertions(1)
    ;(yarnInstall as any as jest.Mock).mockReturnValueOnce({ status: 1, stderr: 'uups' })

    try {
        await handler({} as any)
    } catch (err) {
        expect(
            err.message.startsWith('something went wrong during setup: uups')
        ).toBe(true)
    }
})

test('prints TypeScript setup message', async () => {
    (convertPackageHashToObject as jest.Mock).mockImplementation((input) => input)
    ;(inquirer.prompt as any as jest.Mock).mockReturnValue(Promise.resolve({
        executionMode: 'sync',
        runner: '@wdio/local-runner--$local',
        framework: { package: '@wdio/mocha-framework', short: 'mocha' },
        reporters: [],
        services: [
            { package: '@wdio/crossbrowsertesting-service', short: 'crossbrowsertesting' },
            { package: 'wdio-lambdatest-service', short: 'lambdatest' }
        ],
        generateTestFiles: false,
        isUsingCompiler: 'TypeScript (https://www.typescriptlang.org/)'
    }))
    await handler({} as any)
    expect(consoleLogSpy.mock.calls).toMatchSnapshot()
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
