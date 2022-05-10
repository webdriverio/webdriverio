// @ts-expect-error mock
import { yargs } from 'yargs/yargs'
import fs from 'fs-extra'
import * as installCmd from '../../src/commands/install'
import * as configCmd from '../../src/commands/config'
import * as utils from '../../src/utils'
import yarnInstall from 'yarn-install'

jest.mock('yarn-install')
jest.mock('fs-extra')

let findInConfigMock: jest.SpyInstance

describe('Command: install', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log')
        jest.spyOn(process, 'exit').mockImplementation((code?: number): never => code as never)
        jest.spyOn(configCmd, 'missingConfigurationPrompt').mockImplementation(() => Promise.resolve() as any)
        jest.spyOn(utils, 'addServiceDeps')
        jest.spyOn(utils, 'replaceConfig').mockReturnValueOnce({ foo: 123 } as any)

        findInConfigMock = jest.spyOn(utils, 'findInConfig')
    })

    it('it should properly build command', () => {
        installCmd.builder(yargs)
        expect(yargs.options).toHaveBeenCalled()
        expect(yargs.example).toHaveBeenCalled()
        expect(yargs.epilogue).toHaveBeenCalled()
        expect(yargs.help).toHaveBeenCalled()
    })

    it('should log out when an unknown installation type is passed', async () => {
        await installCmd.handler({ type: 'foobar', config: './wdio.conf.js' } as any)

        expect(console.log).toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith('Type foobar is not supported.')
    })

    it('should log out when unknown package name is used', async () => {
        await installCmd.handler({ type: 'service', name: 'foobar', config: './wdio.conf.js' } as any)

        expect(console.log).toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith('foobar is not a supported service.')
    })

    it('should prompt missing configuration', async () => {
        jest.spyOn(configCmd, 'missingConfigurationPrompt').mockImplementation(() => Promise.reject())
        ;(fs.existsSync as jest.Mock).mockReturnValue(false)

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' } as any)

        expect(configCmd.missingConfigurationPrompt).toHaveBeenCalledWith('install', `Cannot install packages without a WebdriverIO configuration.
You can create one by running 'wdio config'`, undefined)
    })

    it('should verify if configuration already has desired installation', async () => {
        findInConfigMock.mockReturnValue(['chromedriver'])
        ;(fs.existsSync as jest.Mock).mockReturnValue(true)

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' } as any)

        expect(console.log).toHaveBeenCalledWith('The service chromedriver is already part of your configuration.')
    })

    it('should correctly install packages', async () => {
        findInConfigMock.mockReturnValue([''])
        ;(fs.existsSync as jest.Mock).mockReturnValue(true)
        ;(fs.readFileSync as jest.Mock).mockReturnValue('module.config = {}')
        ;(yarnInstall as any as jest.Mock).mockImplementation(() => ({ status: 0 }))

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' } as any)

        expect(console.log).toHaveBeenCalledWith('Installing "wdio-chromedriver-service".')
        expect(console.log).toHaveBeenCalledWith('Package "wdio-chromedriver-service" installed successfully.')
        expect(utils.replaceConfig).toHaveBeenCalled()
        expect(fs.writeFileSync).toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith('Your wdio.conf.js file has been updated.')
        expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should fail if config could not be updated', async () => {
        findInConfigMock.mockReturnValue([''])
        ;(fs.readFileSync as jest.Mock).mockReturnValue('module.config = {}')
        ;(yarnInstall as any as jest.Mock).mockImplementation(() => ({ status: 0 }))
        ;(utils.replaceConfig as jest.Mock).mockRestore()
        jest.spyOn(utils, 'replaceConfig').mockReturnValue('')

        const err = await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' } as any)
            .catch((err: Error) => err) as Error
        expect(err.message).toBe('Couldn\'t find "service" property in wdio.conf.js')

    })

    it('allows for custom config location', async () => {
        findInConfigMock.mockReturnValue([''])
        ;(fs.existsSync as jest.Mock).mockReturnValue(true)
        ;(fs.readFileSync as jest.Mock).mockReturnValue('module.config = {}')
        ;(yarnInstall as any as jest.Mock).mockImplementation(() => ({ status: 0 }))

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './path/to/wdio.conf.js' } as any)

        expect(console.log).toHaveBeenCalledWith('Installing "wdio-chromedriver-service".')
        expect(console.log).toHaveBeenCalledWith('Package "wdio-chromedriver-service" installed successfully.')
        expect(utils.replaceConfig).toHaveBeenCalled()
        expect(fs.writeFileSync).toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith('Your wdio.conf.js file has been updated.')
        expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should exit if there is an error while installing', async () => {
        findInConfigMock.mockReturnValue([''])
        ;(fs.existsSync as jest.Mock).mockReturnValue(true)
        ;(yarnInstall as any as jest.Mock).mockImplementation(() => ({ status: 1, stderr: 'test error' }))
        jest.spyOn(console, 'error')

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' } as any)

        expect(console.error).toHaveBeenCalledWith('Error installing packages', 'test error')
        expect(process.exit).toHaveBeenCalledWith(1)
    })

    afterEach(() => {
        (console.log as jest.Mock).mockClear()
        ;(process.exit as any as jest.Mock).mockClear()
        ;(fs.readFileSync as jest.Mock).mockClear()
        ;(fs.existsSync as jest.Mock).mockClear()
        ;(fs.writeFileSync as jest.Mock).mockClear()

        ;(utils.findInConfig as jest.Mock).mockClear()
        ;(utils.addServiceDeps as jest.Mock).mockClear()
        ;(utils.replaceConfig as jest.Mock).mockClear()
        ;(configCmd.missingConfigurationPrompt as jest.Mock).mockClear()
    })
})
