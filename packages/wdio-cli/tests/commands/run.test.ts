import fs from 'fs-extra'
import yargs from 'yargs'
import * as runCmd from '../../src/commands/run'
import * as configCmd from '../../src/commands/config'

jest.mock('./../../src/launcher', () => class {
    run() {
        return {
            then: jest.fn().mockReturnValue({
                catch: jest.fn().mockReturnValue('launcher-mock')
            })
        }
    }
})
jest.mock('./../../src/watcher', () => class {
    watch() {
        return 'watching-test'
    }
})

jest.mock('fs-extra')

describe('Command: run', () => {
    const setEncodingMock = jest.fn()
    const onMock = jest.fn((s, c) => c())

    beforeEach(() => {
        (fs.existsSync as jest.Mock).mockImplementation(() => true)
        ;(fs.existsSync as jest.Mock).mockClear()
        jest.spyOn(configCmd, 'missingConfigurationPrompt').mockImplementation((): Promise<never> => {
            return undefined as never
        })
        jest.spyOn(console, 'error')
        jest.spyOn(process, 'openStdin').mockImplementation(
            () => ({ setEncoding: setEncodingMock, on: onMock }) as any)
    })

    it('should call missingConfigurationPrompt if no config found', async () => {
        (fs.existsSync as jest.Mock).mockImplementation(() => false)
        await runCmd.handler({} as any)

        expect(configCmd.missingConfigurationPrompt).toHaveBeenCalledTimes(1)
        expect((configCmd.missingConfigurationPrompt as jest.Mock).mock.calls[0][1])
            .toContain('No WebdriverIO configuration found in "')

        ;(fs.existsSync as jest.Mock).mockClear()
    })

    it('should use local conf if nothing defined', async () => {
        (fs.existsSync as jest.Mock).mockImplementation(() => true)
        await runCmd.handler({ argv: {} } as any)
        expect(fs.existsSync).toBeCalledTimes(2)
    })

    it('should use Watcher if "--watch" flag is passed', async () => {
        const watcher = await runCmd.handler({ configPath: 'foo/bar', watch: true } as any)

        expect(watcher).toBe('watching-test')
    })

    it('should call launch if stdin isTTY = true', async () => {
        process.stdin.isTTY = true

        const result = await runCmd.handler({ configPath: 'foo/bar' } as any)

        expect(result).toBe('launcher-mock')
    })

    it('should start process if stdin isTTY = false', async () => {
        process.stdin.isTTY = false
        process.stdout.isTTY = true

        await runCmd.handler({ configPath: 'foo/bar' } as any)

        expect(process.openStdin).toHaveBeenCalled()
        expect(setEncodingMock).toHaveBeenCalled()
        expect(onMock).toHaveBeenCalledTimes(2)

        process.stdin.isTTY = true
        process.stdout.isTTY = false
    })

    it('it should properly build command', () => {
        runCmd.builder(yargs)
        expect(yargs.options).toHaveBeenCalled()
        expect(yargs.example).toHaveBeenCalled()
        expect(yargs.epilogue).toHaveBeenCalled()
        expect(yargs.help).toHaveBeenCalled()
    })

    afterEach(() => {
        (process.openStdin as jest.Mock).mockReset()
        ;(console.error as any as jest.Mock).mockReset()
        ;(fs.existsSync as jest.Mock).mockClear()
        ;(configCmd.missingConfigurationPrompt as jest.Mock).mockClear()
    })
})
