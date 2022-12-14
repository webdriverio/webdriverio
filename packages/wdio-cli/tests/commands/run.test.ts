import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
// @ts-expect-error mock
import { yargs } from 'yargs'
import fs from 'node:fs/promises'
import { execa } from 'execa'
import * as runCmd from '../../src/commands/run.js'
import * as configCmd from '../../src/commands/config.js'

vi.mock('yargs')
vi.mock('execa')
vi.mock('node:child_process', () => ({
    default: {
        spawn: vi.fn()
    }
}))
vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockResolvedValue(true),
        readFile: vi.fn()
    }
}))
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
        vi.mocked(fs.access).mockClear()
        vi.spyOn(configCmd, 'missingConfigurationPrompt').mockImplementation((): Promise<never> => {
            return undefined as never
        })
        vi.spyOn(console, 'error')
        vi.spyOn(process, 'openStdin').mockImplementation(
            () => ({ setEncoding: setEncodingMock, on: onMock }) as any)
    })

    it('should call missingConfigurationPrompt if no config found', async () => {
        vi.mocked(fs.access).mockRejectedValueOnce('not found')
        await runCmd.handler({ configPath: 'sample.conf.js' } as any)
        expect(configCmd.missingConfigurationPrompt).toHaveBeenCalledTimes(1)
        expect(vi.mocked(configCmd.missingConfigurationPrompt).mock.calls[0][1])
            .toContain('sample.conf.js')
    })

    it('should use local conf if nothing defined', async () => {
        await runCmd.handler({ argv: {} } as any)
        expect(fs.access).toBeCalledTimes(2)
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

    describe('launch', () => {
        afterEach(() => {
            vi.mocked(execa).mockClear()
            delete process.env.NODE_OPTIONS
        })

        it('should restart process if esm loader if needed', async () => {
            expect(execa).toBeCalledTimes(0)
            vi.mocked(execa).mockReturnValue({ on: vi.fn() } as any)
            await runCmd.handler({ configPath: '/wdio.conf.ts' } as any)
            expect(execa).toBeCalledTimes(1)
            expect(vi.mocked(execa).mock.calls[0][2]!.env?.NODE_OPTIONS)
                .toContain('--loader ts-node/esm/transpile-only')
        })

        it('should not restart if loader is already provided', async () => {
            expect(execa).toBeCalledTimes(0)
            process.env.NODE_OPTIONS = '--loader ts-node/esm'
            await runCmd.handler({ configPath: '/wdio.conf.ts' } as any)
            expect(execa).toBeCalledTimes(0)
        })
    })

    afterEach(() => {
        vi.mocked(process.openStdin).mockReset()
        vi.mocked(console.error).mockReset()
        vi.mocked(fs.access).mockClear()
        vi.mocked(configCmd.missingConfigurationPrompt).mockClear()
    })
})
