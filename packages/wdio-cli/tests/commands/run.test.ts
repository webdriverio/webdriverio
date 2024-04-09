import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
// @ts-expect-error mock
import { yargs } from 'yargs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execa } from 'execa'
import * as runCmd from '../../src/commands/run.js'
import * as configCmd from '../../src/commands/config.js'

vi.mock('yargs')
vi.mock('execa')
vi.mock('node:child_process', () => ({
    default: {
        spawn: vi.fn(),
        exec: vi.fn()
    },
    exec: vi.fn()
}))
vi.mock('node:fs/promises', async (orig) => ({
    ...(await orig()) as any,
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
        vi.mocked(fs.access).mockRejectedValue('not found')
        await runCmd.handler({ configPath: 'sample.conf.js' } as any)
        expect(configCmd.missingConfigurationPrompt).toHaveBeenCalledTimes(1)
        expect(vi.mocked(configCmd.missingConfigurationPrompt).mock.calls[0][1])
            .toContain('sample.conf')
    })

    it('should use local conf if nothing defined', async () => {
        await runCmd.handler({ argv: {} } as any)
        expect(fs.access).toBeCalledTimes(6)
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

        it('should restart process if esm loader is needed', async () => {
            vi.mocked(fs.access).mockResolvedValue()
            expect(execa).toBeCalledTimes(0)
            vi.mocked(execa).mockReturnValue({ on: vi.fn() } as any)
            await runCmd.handler({ configPath: '/wdio.conf.ts' } as any)
            expect(execa).toBeCalledTimes(1)
            expect(vi.mocked(execa).mock.calls[0][2]!.env?.NODE_OPTIONS)
                .toContain('--loader ts-node/esm/transpile-only')
        })

        it('should load custom tsconfig', async () => {
            vi.mocked(fs.access).mockResolvedValueOnce().mockRejectedValueOnce({}).mockResolvedValue()
            expect(execa).toBeCalledTimes(0)
            vi.mocked(execa).mockReturnValue({ on: vi.fn() } as any)
            process.env.TS_NODE_PROJECT = './config/tsconfig.e2e.json'
            await runCmd.handler({ configPath: '/wdio.conf.ts' } as any)
            expect(execa).toBeCalledTimes(1)
            expect(vi.mocked(execa).mock.calls[0][2]!.env.TS_NODE_PROJECT)
                .toContain(`${path.sep}config${path.sep}tsconfig.e2e.json`)
        })

        it('should load custom ts-node options', async () => {
            vi.mocked(fs.access).mockResolvedValueOnce().mockRejectedValueOnce({}).mockResolvedValue()
            expect(execa).toBeCalledTimes(0)
            vi.mocked(execa).mockReturnValue({ on: vi.fn() } as any)
            process.env.TS_NODE_TYPE_CHECK = 'true'
            await runCmd.handler({ configPath: '/wdio.conf.ts' } as any)
            expect(execa).toBeCalledTimes(1)
            expect(vi.mocked(execa).mock.calls[0][2]!.env.TS_NODE_TYPE_CHECK)
                .toContain('true')
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
