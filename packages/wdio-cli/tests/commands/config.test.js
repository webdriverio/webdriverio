import yarnInstall from 'yarn-install'
import inquirer from 'inquirer'

import { handler } from './../../src/commands/config'
import { addServiceDeps, convertPackageHashToObject, renderConfigurationFile } from '../../src/utils'

jest.mock('../../src/utils', () => ({
    addServiceDeps: jest.fn(),
    convertPackageHashToObject: jest.fn().mockReturnValue('foobar'),
    renderConfigurationFile: jest.fn()
}))

beforeEach(() => {
    yarnInstall.mockClear()
})

test('should create config file', async () => {
    await handler({})
    expect(addServiceDeps).toBeCalledTimes(1)
    expect(convertPackageHashToObject).toBeCalledTimes(4)
    expect(renderConfigurationFile).toBeCalledTimes(1)
    expect(yarnInstall).toHaveBeenCalledWith({
        deps: expect.any(Object),
        dev: true,
        respectNpm5: undefined
    })
})

test('installs @wdio/sync if user requests to run in sync mode', async () => {
    inquirer.prompt.mockReturnValue(Promise.resolve({
        executionMode: 'sync',
        runner: '@wdio/local-runner--$local',
        framework: '@wdio/mocha-framework$--$mocha',
        reporters: [],
        services: []
    }))
    await handler({})
    expect(yarnInstall).toHaveBeenCalledWith({
        deps: [undefined, undefined, '@wdio/sync'],
        dev: true,
        respectNpm5: undefined
    })
})

test('it should install with yarn when flag is passed', async () => {
    await handler({ yarn: true })

    expect(yarnInstall).toHaveBeenCalledWith({
        deps: expect.any(Object),
        dev: true,
        respectNpm5: true
    })
})

test('should throw an error if something goes wrong', async () => {
    expect.assertions(1)
    yarnInstall.mockReturnValue({ status: 1, stderr: 'uups' })

    try {
        await handler({})
    } catch (err) {
        expect(
            err.message.startsWith('something went wrong during setup: uups')
        ).toBe(true)
    }
})
