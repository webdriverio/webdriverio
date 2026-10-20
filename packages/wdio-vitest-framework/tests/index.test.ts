import { beforeEach, describe, expect, it, vi } from 'vitest'

const vitestNode = vi.hoisted(() => ({
    instance: { cancelCurrentRun: vi.fn(async () => {}), close: vi.fn(async () => {}), state: { getTestModules: () => [{}], getUnhandledErrors: () => [] }, config: {} },
    startVitest: vi.fn()
}))

vi.mock('vitest/node', () => ({ startVitest: vitestNode.startVitest }))
vi.mock('../src/config.js', () => ({ toVitestConfig: vi.fn(() => ({ test: {} })) }))

const { launch } = await import('../src/index.js')

type InitReporter = { onInit: (instance: unknown) => void }
const params = (signal?: AbortSignal) => ({ config: {}, specs: [], configFile: '/c.ts', signal }) as never

/** startVitest resolves after the run, so the test aborts while it is pending */
function runningVitest(duringRun: (init: InitReporter) => void) {
    vitestNode.startVitest.mockImplementation(async (_a, _b, viteConfig) => {
        const init = viteConfig.test.reporters.at(-1) as InitReporter
        init.onInit(vitestNode.instance)
        duringRun(init)
        return vitestNode.instance
    })
}

describe('launch', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vitestNode.instance.state.getTestModules = () => []
    })

    it('cancels the current run when the signal aborts during the run', async () => {
        const controller = new AbortController()
        runningVitest(() => controller.abort())
        await launch(params(controller.signal))
        expect(vitestNode.instance.cancelCurrentRun).toHaveBeenCalledWith('keyboard-input')
        expect(vitestNode.instance.close).toHaveBeenCalledTimes(1)
    })

    it('cancels right away when the signal is already aborted', async () => {
        runningVitest(() => {})
        await launch(params(AbortSignal.abort()))
        expect(vitestNode.instance.cancelCurrentRun).toHaveBeenCalledTimes(1)
    })

    it('returns at least one failure when the run was aborted, even with no failed tests', async () => {
        const controller = new AbortController()
        vitestNode.instance.state.getTestModules = () => [{ state: () => 'skipped', children: { allTests: () => [] } }] as never
        runningVitest(() => controller.abort())
        expect(await launch(params(controller.signal))).toBeGreaterThanOrEqual(1)
    })

    it('returns 0 for a clean run that was not aborted', async () => {
        vitestNode.instance.state.getTestModules = () => [{ state: () => 'passed', children: { allTests: () => [] } }] as never
        runningVitest(() => {})
        expect(await launch(params(new AbortController().signal))).toBe(0)
    })

    it('does not cancel without an abort, and ignores an abort after the run', async () => {
        const controller = new AbortController()
        runningVitest(() => {})
        await launch(params(controller.signal))
        controller.abort()
        expect(vitestNode.instance.cancelCurrentRun).not.toHaveBeenCalled()
    })

    it('does not throw or leave an unhandled rejection when cancelling fails', async () => {
        const unhandled = vi.fn()
        process.on('unhandledRejection', unhandled)
        vitestNode.instance.cancelCurrentRun.mockRejectedValueOnce(new Error('cancel failed'))
        runningVitest(() => {})
        await expect(launch(params(AbortSignal.abort()))).resolves.toBeTypeOf('number')
        await new Promise((resolve) => setTimeout(resolve, 10))
        process.off('unhandledRejection', unhandled)
        expect(unhandled).not.toHaveBeenCalled()
    })

    it('removes only the signal listeners Vitest adds while it is created, leaving existing ones', async () => {
        const existing = vi.fn()
        const added = vi.fn()
        process.on('SIGINT', existing)
        runningVitest(() => {})
        vitestNode.startVitest.mockImplementationOnce(async (_a, _b, viteConfig) => {
            process.once('SIGINT', added)
            process.once('SIGTERM', added)
            ;(viteConfig.test.reporters.at(-1) as InitReporter).onInit(vitestNode.instance)
            expect(process.listeners('SIGINT')).toContain(existing)
            expect(process.listeners('SIGINT')).not.toContain(added)
            expect(process.listeners('SIGTERM')).not.toContain(added)
            return vitestNode.instance
        })
        try {
            await launch(params())
        } finally {
            process.off('SIGINT', existing)
        }
    })
})
