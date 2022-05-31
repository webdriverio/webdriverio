import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
// @ts-expect-error mock
import { yargs } from 'yargs/yargs'
import fs from 'fs-extra'
import * as runCmd from '../../src/commands/run'
import * as configCmd from '../../src/commands/config'

vi.mock('yargs/yargs')
vi.mock('fs-extra')
vi.mock('./../../src/launcher', () => ({
    default: class {
        run() {
            return {
                then: vi.fn().mockReturnValue({
                    catch: vi.fn().mockReturnValue('launcher-mock')
                })
            }
        }
    }
}))
vi.mock('./../../src/watcher', () => ({
    default: class {
        watch() {
            return 'watching-test'
        }
    }
}))

describe('Command: run', () => {
    const setEncodingMock = vi.fn()
    const onMock = vi.fn((s, c) => c())

    beforeEach(() => {
        vi.mocked(fs.existsSync).mockImplementation(() => true)
        vi.mocked(fs.existsSync).mockClear()
        vi.spyOn(configCmd, 'missingConfigurationPrompt').mockImplementation((): Promise<never> => {
            return undefined as never
        })
        vi.spyOn(console, 'error')
        vi.spyOn(process, 'openStdin').mockImplementation(
            () => ({ setEncoding: setEncodingMock, on: onMock }) as any)
    })

    it('should call missingConfigurationPrompt if no config found', async () => {
        vi.mocked(fs.existsSync).mockImplementation(() => false)
        await runCmd.handler({} as any)

        expect(configCmd.missingConfigurationPrompt).toHaveBeenCalledTimes(1)
        expect(vi.mocked(configCmd.missingConfigurationPrompt).mock.calls[0][1])
            .toContain('No WebdriverIO configuration found in "')

        vi.mocked(fs.existsSync).mockClear()
    })

    it('should use local conf if nothing defined', async () => {
        vi.mocked(fs.existsSync).mockImplementation(() => true)
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
        vi.mocked(process.openStdin).mockReset()
        vi.mocked(console.error).mockReset()
        vi.mocked(fs.existsSync).mockClear()
        vi.mocked(configCmd.missingConfigurationPrompt).mockClear()
    })
})
