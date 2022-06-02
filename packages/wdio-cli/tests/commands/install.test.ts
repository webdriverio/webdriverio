import path from 'node:path'
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
// @ts-expect-error mock
import { yargs } from 'yargs'
import fs from 'fs-extra'
import * as installCmd from '../../src/commands/install'
import * as configCmd from '../../src/commands/config'
import * as utils from '../../src/utils'
import yarnInstall from 'yarn-install'

vi.mock('yargs')
vi.mock('yarn-install')
vi.mock('fs-extra')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const findInConfigMock = vi.spyOn(utils, 'findInConfig')

describe('Command: install', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log')
        vi.spyOn(process, 'exit').mockImplementation((code?: number): never => code as never)
        vi.spyOn(configCmd, 'missingConfigurationPrompt').mockImplementation(() => Promise.resolve() as any)
        vi.spyOn(utils, 'addServiceDeps')
        vi.spyOn(utils, 'replaceConfig').mockReturnValueOnce({ foo: 123 } as any)
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
        vi.spyOn(configCmd, 'missingConfigurationPrompt').mockImplementation(() => Promise.reject())
        vi.mocked(fs.existsSync).mockReturnValue(false)

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' } as any)

        expect(configCmd.missingConfigurationPrompt).toHaveBeenCalledWith('install', `Cannot install packages without a WebdriverIO configuration.
You can create one by running 'wdio config'`, undefined)
    })

    it('should verify if configuration already has desired installation', async () => {
        findInConfigMock.mockReturnValue(['chromedriver'])
        vi.mocked(fs.existsSync).mockReturnValue(true)

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' } as any)

        expect(console.log).toHaveBeenCalledWith('The service chromedriver is already part of your configuration.')
    })

    it('should correctly install packages', async () => {
        findInConfigMock.mockReturnValue([''])
        vi.mocked(fs.existsSync).mockReturnValue(true)
        vi.mocked(fs.readFileSync).mockReturnValue('module.config = {}')
        vi.mocked(yarnInstall).mockImplementation(() => ({ status: 0 }) as any)

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
        vi.mocked(fs.readFileSync).mockReturnValue('module.config = {}')
        vi.mocked(yarnInstall).mockImplementation(() => ({ status: 0 }) as any)
        vi.mocked(utils.replaceConfig).mockRestore()
        vi.spyOn(utils, 'replaceConfig').mockReturnValue('')

        const err = await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' } as any)
            .catch((err: Error) => err) as Error
        expect(err.message).toBe('Couldn\'t find "service" property in wdio.conf.js')

    })

    it('allows for custom config location', async () => {
        findInConfigMock.mockReturnValue([''])
        vi.mocked(fs.existsSync).mockReturnValue(true)
        vi.mocked(fs.readFileSync).mockReturnValue('module.config = {}')
        vi.mocked(yarnInstall).mockImplementation(() => ({ status: 0 }) as any)

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
        vi.mocked(fs.existsSync).mockReturnValue(true)
        vi.mocked(yarnInstall).mockImplementation(() => ({ status: 1, stderr: 'test error' }))
        vi.spyOn(console, 'error')

        await installCmd.handler({ type: 'service', name: 'chromedriver', config: './wdio.conf.js' } as any)

        expect(console.error).toHaveBeenCalledWith('Error installing packages', 'test error')
        expect(process.exit).toHaveBeenCalledWith(1)
    })

    afterEach(() => {
        vi.mocked(console.log).mockClear()
        vi.mocked(process.exit).mockClear()
        vi.mocked(fs.readFileSync).mockClear()
        vi.mocked(fs.existsSync).mockClear()
        vi.mocked(fs.writeFileSync).mockClear()

        vi.mocked(utils.findInConfig).mockClear()
        vi.mocked(utils.addServiceDeps).mockClear()
        vi.mocked(utils.replaceConfig).mockClear()
        vi.mocked(configCmd.missingConfigurationPrompt).mockClear()
    })
})
