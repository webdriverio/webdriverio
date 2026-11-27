import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import inquirer from 'inquirer'
import { $ } from 'execa'

vi.mock('inquirer', () => ({
    default: {
        prompt: vi.fn()
    }
}))

vi.mock('execa', () => ({
    execa: vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }),
    $: vi.fn().mockReturnValue(async (sh: string) => sh)
}))

vi.mock('read-package-up', () => ({
    readPackageUp: vi.fn().mockResolvedValue({
        path: '/foo/package.json',
        packageJson: { name: 'test-project', type: 'module' }
    })
}))

const sigintCount = () => process.listenerCount('SIGINT')

describe('create-wdio SIGINT scoping', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>
    let processExitSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
        vi.mocked(inquirer.prompt).mockReset()
    })

    afterEach(() => {
        consoleLogSpy.mockRestore()
        processExitSpy.mockRestore()
    })

    it('does not register a SIGINT listener when importing create-wdio modules', async () => {
        const before = sigintCount()
        vi.resetModules()
        await import('../src/utils.js')
        await import('../src/cli/config.js')
        await import('../src/cli/utils.js')
        await import('../src/cli/install.js')
        await import('../src/index.js')
        expect(sigintCount()).toBe(before)
    })

    describe('withSigintExit', () => {
        it('adds a SIGINT listener while active and removes it when resolved', async () => {
            const { withSigintExit } = await import('../src/utils.js')
            const before = sigintCount()
            let during = -1

            const result = await withSigintExit(async () => {
                during = sigintCount()
                return 'ok'
            })

            expect(result).toBe('ok')
            expect(during).toBe(before + 1)
            expect(sigintCount()).toBe(before)
        })

        it('removes the SIGINT listener when the wrapped function rejects', async () => {
            const { withSigintExit } = await import('../src/utils.js')
            const before = sigintCount()

            await expect(withSigintExit(async () => {
                throw new Error('boom')
            })).rejects.toThrow('boom')

            expect(sigintCount()).toBe(before)
            expect(processExitSpy).not.toHaveBeenCalled()
        })

        it('prints goodbye and exits with code 1 on SIGINT while active', async () => {
            const { withSigintExit } = await import('../src/utils.js')
            const before = sigintCount()

            await withSigintExit(async () => {
                process.emit('SIGINT')
            })

            expect(consoleLogSpy).toHaveBeenCalledWith('\n\nGoodbye 👋')
            expect(processExitSpy).toHaveBeenCalledWith(1)
            expect(sigintCount()).toBe(before)
        })

        it('handles nested scopes with a single SIGINT listener', async () => {
            const { withSigintExit } = await import('../src/utils.js')
            const before = sigintCount()
            let outerCount = -1
            let innerCount = -1
            let afterInnerCount = -1

            await withSigintExit(async () => {
                outerCount = sigintCount()
                await withSigintExit(async () => {
                    innerCount = sigintCount()
                })
                afterInnerCount = sigintCount()
            })

            expect(outerCount).toBe(before + 1)
            expect(innerCount).toBe(before + 1)
            expect(afterInnerCount).toBe(before + 1)
            expect(sigintCount()).toBe(before)
        })

        it('maps Inquirer ExitPromptError to goodbye exit, rethrows it, and removes listener', async () => {
            const { withSigintExit } = await import('../src/utils.js')
            const before = sigintCount()
            const err = new Error('User force closed the prompt with SIGINT')
            err.name = 'ExitPromptError'

            await expect(withSigintExit(async () => {
                throw err
            })).rejects.toBe(err)

            expect(consoleLogSpy).toHaveBeenCalledTimes(1)
            expect(consoleLogSpy).toHaveBeenCalledWith('\n\nGoodbye 👋')
            expect(processExitSpy).toHaveBeenCalledTimes(1)
            expect(processExitSpy).toHaveBeenCalledWith(1)
            expect(sigintCount()).toBe(before)
        })

        it('prints goodbye and exits only once when ExitPromptError unwinds nested scopes', async () => {
            const { withSigintExit } = await import('../src/utils.js')
            const before = sigintCount()
            const err = new Error('User force closed the prompt with SIGINT')
            err.name = 'ExitPromptError'

            await expect(withSigintExit(async () => withSigintExit(async () => {
                throw err
            }))).rejects.toBe(err)

            expect(consoleLogSpy).toHaveBeenCalledTimes(1)
            expect(consoleLogSpy).toHaveBeenCalledWith('\n\nGoodbye 👋')
            expect(processExitSpy).toHaveBeenCalledTimes(1)
            expect(processExitSpy).toHaveBeenCalledWith(1)
            expect(sigintCount()).toBe(before)
        })
    })

    describe('wizard entry points', () => {
        it('does not attach a SIGINT listener when getAnswers runs with --yes', async () => {
            const { getAnswers } = await import('../src/utils.js')
            const before = sigintCount()
            await getAnswers(true)
            expect(sigintCount()).toBe(before)
        })

        it('scopes the SIGINT listener to interactive prompts in getAnswers(false)', async () => {
            const { getAnswers } = await import('../src/utils.js')
            const before = sigintCount()
            let duringPrompt = -1

            vi.mocked(inquirer.prompt).mockImplementation((async () => {
                duringPrompt = sigintCount()
                return {
                    projectRootCorrect: true,
                    framework: '@wdio/mocha-framework$--$mocha',
                    runner: '@wdio/local-runner$--$local',
                    services: [],
                    plugins: [],
                    reporters: []
                }
            }) as never)

            await getAnswers(false)
            expect(duringPrompt).toBe(before + 1)
            expect(sigintCount()).toBe(before)
        })

        it('scopes the SIGINT listener to runAppiumInstaller prompts', async () => {
            const { runAppiumInstaller } = await import('../src/utils.js')
            const before = sigintCount()
            const originalIsTTY = process.stdin.isTTY
            let duringPrompt = -1

            Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })
            vi.mocked(inquirer.prompt).mockImplementation((async () => {
                duringPrompt = sigintCount()
                return { continueWithAppiumSetup: false }
            }) as never)

            try {
                await runAppiumInstaller({ e2eEnvironment: 'mobile' } as never, false)
            } finally {
                Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
            }

            expect(duringPrompt).toBe(before + 1)
            expect(sigintCount()).toBe(before)
            expect($).not.toHaveBeenCalled()
        })

        it('scopes the SIGINT listener to missingConfigurationPrompt and cleans up on rejection', async () => {
            const { missingConfigurationPrompt } = await import('../src/cli/utils.js')
            const before = sigintCount()
            let duringPrompt = -1
            let duringConfigCmd = -1

            vi.mocked(inquirer.prompt)
                .mockImplementationOnce((async () => {
                    duringPrompt = sigintCount()
                    return { config: true }
                }) as never)
                .mockImplementation((async () => ({
                    projectRootCorrect: true,
                    runner: '@wdio/local-runner$--$local',
                    framework: '@wdio/mocha-framework$--$mocha',
                    services: [],
                    plugins: [],
                    reporters: []
                })) as never)

            const runConfigCmd = vi.fn(async () => {
                duringConfigCmd = sigintCount()
                return true
            })

            await missingConfigurationPrompt('run', '/tmp/wdio.conf', runConfigCmd)
            expect(duringPrompt).toBe(before + 1)
            expect(duringConfigCmd).toBe(before + 1)
            expect(sigintCount()).toBe(before)

            vi.mocked(inquirer.prompt).mockRejectedValueOnce(new Error('prompt failed'))
            await expect(missingConfigurationPrompt('run', '/tmp/wdio.conf', vi.fn())).rejects.toThrow('prompt failed')
            expect(sigintCount()).toBe(before)
        })

        it('scopes the SIGINT listener to wdio config handler execution', async () => {
            const { handler } = await import('../src/cli/config.js')
            const before = sigintCount()
            let duringConfigCmd = -1

            const runConfigCmd = vi.fn(async () => {
                duringConfigCmd = sigintCount()
                return true
            })

            await handler({ yes: true, npmTag: 'latest' } as never, runConfigCmd)
            expect(duringConfigCmd).toBe(before + 1)
            expect(sigintCount()).toBe(before)
        })
    })
})
