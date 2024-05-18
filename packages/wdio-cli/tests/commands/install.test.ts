import fs from 'node:fs/promises'
import path from 'node:path'
import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
// @ts-expect-error mock
import { yargs } from 'yargs'

import * as installCmd from '../../src/commands/install.js'
import * as configCmd from '../../src/commands/config.js'
import * as utils from '../../src/utils.js'
import { installPackages } from '../../src/install.js'

vi.mock('yargs')
vi.mock('node:fs/promises', async (orig) => ({
    ...(await orig()) as any,
    default: {
        access: vi.fn().mockResolvedValue({}),
        readFile: vi.fn().mockResolvedValue('export const config = {}'),
        writeFile: vi.fn().mockResolvedValue({})
    }
}))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../src/install', () => ({
    installPackages: vi.fn(),
    getInstallCommand: vi.fn().mockReturnValue('npm install foo bar --save-dev')
}))
vi.mock('../../src/utils', async (origMod) => {
    const orig: any = await origMod()
    return {
        ...orig,
        detectPackageManager: vi.fn().mockReturnValue('npm'),
    }
})

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
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('Error: foobar is not a supported service.')
        )
    })

    it('should prompt missing configuration', async () => {
        vi.spyOn(configCmd, 'formatConfigFilePaths').mockReturnValue({ fullPath: '/absolute/path/to/wdio.conf.js', fullPathNoExtension: '/absolute/path/to/wdio.conf' } as any)
        vi.spyOn(configCmd, 'missingConfigurationPrompt').mockImplementation(() => Promise.reject())
        vi.mocked(fs.access).mockRejectedValue(new Error('Doesn\'t exist'))

        await installCmd.handler({ type: 'service', name: 'vite', config: './wdio.conf.js' } as any)

        expect(configCmd.missingConfigurationPrompt).toHaveBeenCalledWith(
            'install',
            '/absolute/path/to/wdio.conf'
        )
    })

    it('should verify if configuration already has desired installation', async () => {
        findInConfigMock.mockReturnValue(['vite'])
        vi.mocked(fs.access).mockResolvedValue()

        await installCmd.handler({ type: 'service', name: 'vite', config: './wdio.conf.js' } as any)

        expect(console.log).toHaveBeenCalledWith('The service vite is already part of your configuration.')
    })

    it('should correctly install packages', async () => {
        findInConfigMock.mockReturnValue([''])
        vi.mocked(fs.access).mockResolvedValue()
        vi.mocked(fs.readFile).mockResolvedValue('module.config = {}')
        vi.mocked(installPackages).mockResolvedValue(true)

        await installCmd.handler({ type: 'service', name: 'vite', config: './wdio.conf.js' } as any)

        expect(console.log).toHaveBeenCalledWith('Installing "wdio-vite-service" using npm.')
        expect(console.log).toHaveBeenCalledWith('Package "wdio-vite-service" installed successfully.')
        expect(utils.replaceConfig).toHaveBeenCalled()
        expect(fs.writeFile).toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith('Your wdio.conf.js file has been updated.')
        expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should fail if config could not be updated', async () => {
        findInConfigMock.mockReturnValue([''])
        vi.mocked(fs.readFile).mockResolvedValue('module.config = {}')
        vi.mocked(installPackages).mockResolvedValue(true)
        vi.mocked(utils.replaceConfig).mockRestore()
        vi.spyOn(utils, 'replaceConfig').mockReturnValue('')

        const err = await installCmd.handler({ type: 'service', name: 'vite', config: './wdio.conf.js' } as any)
            .catch((err: Error) => err) as Error
        expect(err.message).toBe('Couldn\'t find "service" property in wdio.conf.js')

    })

    it('allows for custom config location', async () => {
        findInConfigMock.mockReturnValue([''])
        vi.mocked(fs.access).mockResolvedValue()
        vi.mocked(fs.readFile).mockResolvedValue('module.config = {}')
        vi.mocked(installPackages).mockResolvedValue(true)

        await installCmd.handler({ type: 'service', name: 'vite', config: './path/to/wdio.conf.js' } as any)

        expect(console.log).toHaveBeenCalledWith('Installing "wdio-vite-service" using npm.')
        expect(console.log).toHaveBeenCalledWith('Package "wdio-vite-service" installed successfully.')
        expect(utils.replaceConfig).toHaveBeenCalled()
        expect(fs.writeFile).toHaveBeenCalled()
        expect(console.log).toHaveBeenCalledWith('Your wdio.conf.js file has been updated.')
        expect(process.exit).toHaveBeenCalledWith(0)
    })

    it('should exit if there is an error while installing', async () => {
        findInConfigMock.mockReturnValue([''])
        vi.mocked(fs.access).mockResolvedValue()
        vi.mocked(installPackages).mockResolvedValue(false)
        await installCmd.handler({ type: 'service', name: 'vite', config: './wdio.conf.js' } as any)
        expect(process.exit).toHaveBeenCalledWith(1)
    })

    afterEach(() => {
        vi.mocked(console.log).mockClear()
        vi.mocked(process.exit).mockClear()
        vi.mocked(fs.readFile).mockClear()
        vi.mocked(fs.access).mockClear()
        vi.mocked(fs.writeFile).mockClear()

        vi.mocked(utils.findInConfig).mockClear()
        vi.mocked(utils.addServiceDeps).mockClear()
        vi.mocked(utils.replaceConfig).mockClear()
        vi.mocked(configCmd.missingConfigurationPrompt).mockClear()
    })
})
