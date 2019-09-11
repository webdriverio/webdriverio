import yarnInstall from 'yarn-install'

import { handler } from './../../src/commands/config'
import { addServiceDeps, convertPackageHashToObject, renderConfigurationFile } from '../../src/utils'

jest.mock('../../src/utils', () => ({
    addServiceDeps: jest.fn(),
    convertPackageHashToObject: jest.fn().mockReturnValue('foobar'),
    renderConfigurationFile: jest.fn()
}))

test('should create config file', async () => {
    await handler({})
    expect(addServiceDeps).toBeCalledTimes(1)
    expect(convertPackageHashToObject).toBeCalledTimes(3)
    expect(renderConfigurationFile).toBeCalledTimes(1)
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
