import fs from 'node:fs/promises'
import path from 'node:path'

import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest'
// @ts-expect-error mock
import { yargs } from 'yargs'
import * as runCmd from '../../src/commands/run.js'
import { config as configCmd } from 'create-wdio/config/cli'

vi.mock('yargs')
vi.mock('node:child_process', () => ({
    default: {
        spawn: vi.fn(),
        exec: vi.fn()
    },
    exec: vi.fn()
}))
vi.mock('node:fs/promises', async (orig) => ({
    // ...(await orig()) as any,
    default: {
        access: vi.fn().mockResolvedValue(''),
        readFile: vi.fn()
    }
}))
vi.mock('create-wdio/config/cli', async (importActual)=>{
    const actual = await importActual() as any
    return {
        config: {
            ...actual.config,
            missingConfigurationPrompt:vi.fn(),
        }
    }
})
vi.mock('./../../src/launcher', () => ({
    default: class {
        constructor (public wdioConfPath: string) {}
        run() {
            return {
                then: vi.fn().mockReturnValue({
                    catch: vi.fn().mockReturnValue(`launcher-mock(${this.wdioConfPath})`)
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
vi.mock('@wdio/utils', () => ({
    duration: {
        start: vi.fn(),
        end: vi.fn(),
        reset: vi.fn(),
        getSummary: vi.fn(() => '100ms (setup 50ms, prepare 25ms, execute 20ms, complete 5ms)')
    }
}))
describe('Command: run', () => {
    const setEncodingMock = vi.fn()
    const onMock = vi.fn((s, c) => c())

    beforeEach(() => {
        vi.mocked(fs.access).mockResolvedValue()
        vi.mocked(configCmd.missingConfigurationPrompt).mockImplementation((): Promise<never> => {
            return undefined as never
        })
        vi.spyOn(console, 'error')
        vi.spyOn(process.stdin, 'resume')
        vi.spyOn(process.stdin, 'setEncoding').mockImplementation(setEncodingMock)
        vi.spyOn(process.stdin, 'on').mockImplementation(onMock)
    })

    it('should call missingConfigurationPrompt if no config found', async () => {
        vi.mocked(fs.access).mockRejectedValue('not found')
        await runCmd.handler({ configPath: 'sample.conf.js' } as any)
        expect(configCmd.missingConfigurationPrompt).toHaveBeenCalledTimes(1)
        expect(vi.mocked(configCmd.missingConfigurationPrompt).mock.calls[0][1])
            .toContain('sample.conf')
    })

    it('should check for js and ts default config files', async () => {
        vi.mocked(fs.access)
            .mockRejectedValueOnce('not found')
            .mockRejectedValueOnce('not found')
        const result = await runCmd.handler({ configPath: 'sample.conf.js' } as any)
        expect(result).toContain('sample.conf.ts')
    })

    it('should use local conf if nothing defined', async () => {
        const launcher = await runCmd.handler({ argv: {} } as any)
        expect(launcher).toContain('wdio.conf.js')
    })

    it('should use Watcher if "--watch" flag is passed', async () => {
        const watcher = await runCmd.handler({ configPath: 'foo/bar', watch: true } as any)

        expect(watcher).toBe('watching-test')
    })

    it('should call launch if stdin isTTY = true', async () => {
        process.stdin.isTTY = true

        const result = await runCmd.handler({ configPath: 'foo/bar' } as any)

        expect(result).toContain('launcher-mock')
    })

    it('should start process if stdin isTTY = false', async () => {
        process.stdin.isTTY = false
        process.stdout.isTTY = true

        await runCmd.handler({ configPath: 'foo/bar' } as any)

        expect(process.stdin.resume).toHaveBeenCalled()
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
            delete process.env.TSCONFIG_PATH
            delete process.env.TSX_TSCONFIG_PATH
        })

        it('should set TSX_TSCONFIG_PATH if TSCONFIG_PATH is set', async () => {
            process.env.TSCONFIG_PATH = '/foo/bar/loo/tsconfig.e2e.json'
            await runCmd.handler({ configPath: '/wdio.conf.ts' } as any)
            expect(process.env.TSX_TSCONFIG_PATH).toContain(
                `${path.sep}foo${path.sep}bar${path.sep}loo${path.sep}tsconfig.e2e.json`
            )
        })

        it('should set TSX_TSCONFIG_PATH if found in params', async () => {
            vi.mocked(fs.access).mockResolvedValue()
            await runCmd.handler({ configPath: '/wdio.conf.ts', tsConfigPath: '/bar/foo/tsconfig.e2e.json' } as any)
            expect(process.env.TSX_TSCONFIG_PATH).toContain(
                `${path.sep}bar${path.sep}foo${path.sep}tsconfig.e2e.json`
            )
        })

        it('should restart process if custom tsconfig was found next to the wdio.config', async () => {
            vi.mocked(fs.access).mockResolvedValue()
            await runCmd.handler({ configPath: '/full/path/wdio.conf.ts' } as any)
            expect(process.env.TSX_TSCONFIG_PATH).toContain(
                `${path.sep}full${path.sep}path${path.sep}tsconfig.json`
            )
        })
    })

    afterEach(() => {
        vi.mocked(console.error).mockReset()
        vi.mocked(configCmd.missingConfigurationPrompt).mockClear()
    })
})
