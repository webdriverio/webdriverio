import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import inquirer from 'inquirer'

vi.mock('inquirer', () => ({ default: { prompt: vi.fn().mockResolvedValue({}) } }))

const sigintListeners = () => process.listenerCount('SIGINT')

describe('SIGINT handling', () => {
    let initialListeners: Function[]
    let exit: ReturnType<typeof vi.spyOn>
    let log: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        vi.resetModules()
        vi.mocked(inquirer.prompt).mockResolvedValue({} as never)
        initialListeners = process.listeners('SIGINT')
        exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
        log = vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        exit.mockRestore()
        log.mockRestore()
        for (const listener of process.listeners('SIGINT')) {
            if (!initialListeners.includes(listener)) {
                process.removeListener('SIGINT', listener as NodeJS.SignalsListener)
            }
        }
    })

    it.each([
        ['config/cli', () => import('../src/config/cli.js')],
        ['install/cli', () => import('../src/install/cli.js')],
        ['utils', () => import('../src/utils.js')]
    ])('does not add a listener when %s is imported', async (_name, load) => {
        const before = sigintListeners()
        await load()
        expect(sigintListeners()).toBe(before)
    })

    it('has the goodbye handler only while the wizard prompts, and exits on SIGINT then', async () => {
        const { getAnswers } = await import('../src/utils.js')
        const before = sigintListeners()
        let during = -1
        vi.mocked(inquirer.prompt).mockImplementation((async () => {
            during = sigintListeners()
            const [onSigint] = process.listeners('SIGINT').filter((listener) => !initialListeners.includes(listener))
            ;(onSigint as () => void)()
            return {}
        }) as never)
        await getAnswers(false)
        expect(during).toBe(before + 1)
        expect(log).toHaveBeenCalledWith('\n\nGoodbye 👋')
        expect(exit).toHaveBeenCalledWith(1)
        expect(sigintListeners()).toBe(before)
    })

    it('exits with the goodbye message when the prompt is force closed', async () => {
        const { withSigintExit } = await import('../src/utils.js')
        const err = Object.assign(new Error('closed'), { name: 'ExitPromptError' })
        await expect(withSigintExit(() => Promise.reject(err))).rejects.toBe(err)
        expect(log).toHaveBeenCalledWith('\n\nGoodbye 👋')
        expect(exit).toHaveBeenCalledWith(1)
    })

    it('registers nothing for --yes', async () => {
        const { getAnswers } = await import('../src/utils.js')
        const before = sigintListeners()
        const addListener = vi.spyOn(process, 'on')
        await getAnswers(true)
        expect(addListener).not.toHaveBeenCalledWith('SIGINT', expect.anything())
        addListener.mockRestore()
        expect(sigintListeners()).toBe(before)
    })

    it('wraps the `npm init wdio` entry and leaves no listener after it', async () => {
        const { run } = await import('../src/index.js')
        const before = sigintListeners()
        const argv = vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'create-wdio'])
        let during = -1
        await run(vi.fn(async () => { during = sigintListeners() }))
        argv.mockRestore()
        expect(during).toBe(before + 1)
        expect(sigintListeners()).toBe(before)
    })

    describe('missingConfigurationPrompt', () => {
        it('leaves no listener after it resolves', async () => {
            const { missingConfigurationPrompt } = await import('../src/cli/utils.js')
            const before = sigintListeners()
            let during = -1
            vi.mocked(inquirer.prompt).mockImplementation((async () => {
                during = sigintListeners()
                return { config: true }
            }) as never)
            const runConfig = vi.fn()
            await missingConfigurationPrompt('run', '/tmp/wdio.conf', runConfig).catch(() => {})
            expect(during).toBe(before + 1)
            expect(sigintListeners()).toBe(before)
        })

        it('has a listener while runConfigCmd runs and none after it returns', async () => {
            const { missingConfigurationPrompt } = await import('../src/cli/utils.js')
            const before = sigintListeners()
            vi.mocked(inquirer.prompt).mockResolvedValue({
                config: true,
                runner: '@wdio/local-runner$--$local$--$e2e',
                framework: '@wdio/mocha-framework$--$mocha',
                services: [],
                plugins: [],
                reporters: [],
                projectRootCorrect: true
            } as never)
            let during = -1
            const runConfig = vi.fn(async () => { during = sigintListeners() })
            await missingConfigurationPrompt('run', '/tmp/wdio.conf', runConfig)
            expect(runConfig).toHaveBeenCalledOnce()
            expect(during).toBe(before + 1)
            expect(sigintListeners()).toBe(before)
        })

        it('leaves no listener after it rejects', async () => {
            const { missingConfigurationPrompt } = await import('../src/cli/utils.js')
            const before = sigintListeners()
            vi.mocked(inquirer.prompt).mockRejectedValue(new Error('boom'))
            await expect(missingConfigurationPrompt('run', '/tmp/wdio.conf', vi.fn())).rejects.toThrow('boom')
            expect(sigintListeners()).toBe(before)
        })
    })
})
