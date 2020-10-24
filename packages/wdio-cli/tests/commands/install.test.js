import yargs from 'yargs'
import fs from 'fs-extra'
import * as installCmd from './../../src/commands/install'
import * as configCmd from './../../src/commands/config'
import * as utils from './../../src/utils'
import yarnInstall from 'yarn-install'

jest.mock('yarn-install')
jest.mock('fs-extra')

let findInConfigMock

describe('Command: install', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log')
        jest.spyOn(process, 'exit').mockImplementation(() => {})
        jest.spyOn(configCmd, 'missingConfigurationPrompt').mockImplementation(() => Promise.resolve())
        jest.spyOn(utils, 'addServiceDeps')
        jest.spyOn(utils, 'replaceConfig')

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
        await installCmd.handler({ type: 'foobar', config: './wdio.conf.js' })

        expect(console.log).toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith('Type foobar is not supported.')
    })

    it('should log out when unknown package name is used', async () => {
        await installCmd.handler({ type: 'service', name: 'foobar', config: './wdio.conf.js' })

        expect(console.log).toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith('foobar is not a supported service.')
    })

    it('should prompt missing configuration', async () => {
        jest.spyOn(configCmd, 'missingConfigurationPrompt').mockImplementation(() => Promise.reject())
        fs.existsSync.mockReturnValue(false)

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' })

        expect(configCmd.missingConfigurationPrompt).toHaveBeenCalledWith('install', `Cannot install packages without a WebdriverIO configuration.
You can create one by running 'wdio config'`, undefined)
    })

    it('should verify if configuration already has desired installation', async () => {
        findInConfigMock.mockReturnValue(['chromedriver'])
        fs.existsSync.mockReturnValue(true)

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' })

        expect(console.log).toHaveBeenCalledWith('The service chromedriver is already part of your configuration.')
    })

    it('should correctly install packages', async () => {
        findInConfigMock.mockReturnValue([''])
        fs.existsSync.mockReturnValue(true)
        fs.readFileSync.mockReturnValue('module.config = {}')
        yarnInstall.mockImplementation(() => ({ status: 0 }))

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' })

        expect(console.log).toHaveBeenCalledWith('Installing "wdio-chromedriver-service".')
        expect(console.log).toHaveBeenCalledWith('Package "wdio-chromedriver-service" installed successfully.')
        expect(utils.replaceConfig).toHaveBeenCalled()
        expect(fs.writeFileSync).toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith('Your wdio.conf.js file has been updated.')
        expect(process.exit).toHaveBeenCalledWith(0)
    })
    it('allows for custom config location', async () => {
        findInConfigMock.mockReturnValue([''])
        fs.existsSync.mockReturnValue(true)
        fs.readFileSync.mockReturnValue('module.config = {}')
        yarnInstall.mockImplementation(() => ({ status: 0 }))

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './path/to/wdio.conf.js' })

        expect(console.log).toHaveBeenCalledWith('Installing "wdio-chromedriver-service".')
        expect(console.log).toHaveBeenCalledWith('Package "wdio-chromedriver-service" installed successfully.')
        expect(utils.replaceConfig).toHaveBeenCalled()
        expect(fs.writeFileSync).toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith('Your wdio.conf.js file has been updated.')
        expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should exit if there is an error while installing', async () => {
        findInConfigMock.mockReturnValue([''])
        fs.existsSync.mockReturnValue(true)
        yarnInstall.mockImplementation(() => ({ status: 1, stderr: 'test error' }))
        jest.spyOn(console, 'error')

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' })

        expect(console.error).toHaveBeenCalledWith('Error installing packages', 'test error')
        expect(process.exit).toHaveBeenCalledWith(1)
    })

    afterEach(() => {
        console.log.mockClear()
        process.exit.mockClear()
        fs.readFileSync.mockClear()
        fs.existsSync.mockClear()
        fs.writeFileSync.mockClear()

        utils.findInConfig.mockClear()
        utils.addServiceDeps.mockClear()
        utils.replaceConfig.mockClear()
        configCmd.missingConfigurationPrompt.mockClear()
    })
})
