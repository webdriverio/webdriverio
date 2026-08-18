import { describe, expect, it, vi } from 'vitest'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { StructuredToolInterface } from '@langchain/core/tools'
import { warmupModel, WARMUP_TIMEOUT_MS } from '../src/commands/warmup.js'

const PROBE = 'Warmup probe — reply with a single dot: ready'

describe('warmupModel', () => {
    it('binds the tool schema and invokes the bound model with the probe prompt', async () => {
        const tool = { name: 't', description: 'd' } as unknown as StructuredToolInterface
        const invoke = vi.fn().mockResolvedValue(undefined)
        const bindTools = vi.fn().mockReturnValue({ invoke })
        const model = { bindTools, invoke: vi.fn() } as unknown as BaseChatModel

        await warmupModel(model, [tool])

        expect(bindTools).toHaveBeenCalledWith([tool])
        expect(invoke).toHaveBeenCalledWith(PROBE, undefined)
        expect(model.invoke).not.toHaveBeenCalled()
    })

    it('invokes the model directly when bindTools is unavailable', async () => {
        const invoke = vi.fn().mockResolvedValue(undefined)
        const model = { invoke } as unknown as BaseChatModel

        await warmupModel(model, [])

        expect(invoke).toHaveBeenCalledWith(PROBE, undefined)
    })

    it('passes the abort signal to invoke and rejects with the abort error', async () => {
        const abortError = new Error('warmup aborted')
        const invoke = vi.fn().mockRejectedValue(abortError)
        const model = { invoke } as unknown as BaseChatModel
        const signal = new AbortController().signal

        await expect(warmupModel(model, [], signal)).rejects.toThrow(abortError)

        expect(invoke).toHaveBeenCalledWith(PROBE, { signal })
    })

    it('resolves after the timeout when the model never responds', async () => {
        vi.useFakeTimers()
        try {
            const model = { invoke: vi.fn().mockReturnValue(new Promise(() => {})) } as unknown as BaseChatModel
            const settled = vi.fn()
            void warmupModel(model, []).then(settled)

            await vi.advanceTimersByTimeAsync(WARMUP_TIMEOUT_MS)

            expect(settled).toHaveBeenCalled()
        } finally {
            vi.useRealTimers()
        }
    })
})
