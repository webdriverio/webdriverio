import fs from 'fs-extra'
import yargs from 'yargs'
import * as runCmd from './../../src/commands/run'
import * as configCmd from './../../src/commands/config'

jest.mock('./../../src/launcher', () => class LauncherMock {
    run() {
        return {
            then: jest.fn().mockReturnValue({
                catch: jest.fn().mockReturnValue('launcher-mock')
            })
        }
    }
})
jest.mock('./../../src/watcher', () => class WatcherMock {
    watch() {
        return 'watching-test'
    }
})

jest.mock('fs-extra')

describe('Command: run', () => {
    const setEncodingMock = jest.fn()
    const onMock = jest.fn((s, c) => c())

    beforeEach(() => {
        fs.existsSync.mockImplementation(() => true)
        fs.existsSync.mockClear()
        jest.spyOn(configCmd, 'missingConfigurationPrompt').mockImplementation(() => {})
        jest.spyOn(console, 'error')
        jest.spyOn(process, 'openStdin').mockImplementation(
            () => ({ setEncoding: setEncodingMock, on: onMock }))
    })

    it('should call missingConfigurationPrompt if no config found', async () => {
        fs.existsSync.mockImplementation(() => false)
        await runCmd.handler({ configPath: 'foo/bar' })

        expect(configCmd.missingConfigurationPrompt).toHaveBeenCalled()
        expect(configCmd.missingConfigurationPrompt)
            .toHaveBeenCalledWith('run', 'No WebdriverIO configuration found in "foo/bar"')

        fs.existsSync.mockClear()
    })

    it('should use local conf if nothing defined', async () => {
        fs.existsSync.mockImplementation(() => true)
        await runCmd.handler({})
        expect(fs.existsSync).toBeCalledTimes(2)
    })

    it('should use Watcher if "--watch" flag is passed', async () => {
        const watcher = await runCmd.handler({ configPath: 'foo/bar', watch: true })

        expect(watcher).toBe('watching-test')
    })

    it('should call launch if stdin isTTY = true', async () => {
        process.stdin.isTTY = true

        const result = await runCmd.handler({ configPath: 'foo/bar' })

        expect(result).toBe('launcher-mock')
    })

    it('should start process if stdin isTTY = false', async () => {
        process.stdin.isTTY = false
        process.stdout.isTTY = true

        await runCmd.handler({ configPath: 'foo/bar' })

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
        process.openStdin.mockReset()
        console.error.mockReset()
        fs.existsSync.mockClear()
        configCmd.missingConfigurationPrompt.mockClear()
    })
})
