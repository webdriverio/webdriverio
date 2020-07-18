import yargs from 'yargs'
import yarnInstall from 'yarn-install'
import inquirer from 'inquirer'

import { handler, builder } from './../../src/commands/config'
import { addServiceDeps, convertPackageHashToObject, renderConfigurationFile, generateTestFiles } from '../../src/utils'

jest.mock('../../src/utils', () => ({
    addServiceDeps: jest.fn(),
    convertPackageHashToObject: jest.fn().mockReturnValue('foobar'),
    renderConfigurationFile: jest.fn(),
    hasFile: jest.fn().mockReturnValue(false),
    getAnswers: jest.fn().mockImplementation(jest.requireActual('../../src/utils').getAnswers),
    generateTestFiles: jest.fn()
}))

const errorLogSpy = jest.spyOn(console, 'error')
const consoleLogSpy = jest.spyOn(console, 'log')
beforeEach(() => {
    yarnInstall.mockClear()
    yarnInstall.mockReturnValue({ status: 0 })
    errorLogSpy.mockClear()
    consoleLogSpy.mockClear()
})

afterEach(() => {
    errorLogSpy.mockReset()
})

test('should create config file', async () => {
    await handler({})
    expect(addServiceDeps).toBeCalledTimes(1)
    expect(convertPackageHashToObject).toBeCalledTimes(4)
    expect(renderConfigurationFile).toBeCalledTimes(1)
    expect(generateTestFiles).toBeCalledTimes(0)
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
    renderConfigurationFile.mockReturnValueOnce(Promise.reject(new Error('boom!')))
    await handler({})
    expect(errorLogSpy).toHaveBeenCalledTimes(1)
})

test('installs @wdio/sync if user requests to run in sync mode', async () => {
    inquirer.prompt.mockReturnValue(Promise.resolve({
        executionMode: 'sync',
        runner: '@wdio/local-runner--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        generateTestFiles: true,
        reporters: [],
        services: []
    }))
    await handler({})
    expect(generateTestFiles).toBeCalledTimes(1)
    expect(yarnInstall).toHaveBeenCalledWith({
        deps: ['@wdio/local-runner', undefined, '@wdio/sync'],
        dev: true,
        respectNpm5: true
    })
})

test('it should install with yarn when flag is passed', async () => {
    await handler({ yarn: true })

    expect(yarnInstall).toHaveBeenCalledWith({
        deps: expect.any(Object),
        dev: true,
        respectNpm5: false
    })
})

test('should throw an error if something goes wrong', async () => {
    expect.assertions(1)
    yarnInstall.mockReturnValueOnce({ status: 1, stderr: 'uups' })

    try {
        await handler({})
    } catch (err) {
        expect(
            err.message.startsWith('something went wrong during setup: uups')
        ).toBe(true)
    }
})

test('prints TypeScript setup message', async () => {
    convertPackageHashToObject.mockImplementation((input) => input)
    inquirer.prompt.mockReturnValue(Promise.resolve({
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
    await handler({})
    expect(consoleLogSpy.mock.calls).toMatchSnapshot()
})
