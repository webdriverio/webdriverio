import { describe, expect, it, vi } from 'vitest'
import { ToolMessage } from '@langchain/core/messages'
import { createLoopGuardMiddleware } from '../src/loop-guard.js'

function callTool(mw: ReturnType<typeof createLoopGuardMiddleware>, name: string, args: Record<string, unknown>, id: string, handler: ReturnType<typeof vi.fn>) {
    return mw.wrapToolCall!({ toolCall: { name, args, id } } as never, handler)
}

describe('loopGuard', () => {
    it('returns a ToolMessage on the Nth identical call and forwards the rest', async () => {
        const handler = vi.fn(async () => new ToolMessage({ tool_call_id: 'c1', content: 'ok' }))
        const mw = createLoopGuardMiddleware()

        const r1 = await callTool(mw, 'execute_script', { script: 'x' }, 'c1', handler)
        const r2 = await callTool(mw, 'execute_script', { script: 'x' }, 'c2', handler)
        const r3 = await callTool(mw, 'execute_script', { script: 'x' }, 'c3', handler)

        expect(handler).toHaveBeenCalledTimes(2)
        expect(r1).toBeInstanceOf(ToolMessage)
        expect(r2).toBeInstanceOf(ToolMessage)
        expect(r3).toBeInstanceOf(ToolMessage)
        expect((r3 as ToolMessage).content).toMatch(/loop guard/)
        expect((r3 as ToolMessage).content).toContain('execute_script')
    })

    it('resets the counter on different args', async () => {
        const handler = vi.fn(async () => new ToolMessage({ tool_call_id: 'c1', content: 'ok' }))
        const mw = createLoopGuardMiddleware()

        await callTool(mw, 'execute_script', { script: 'x' }, 'c1', handler)
        await callTool(mw, 'execute_script', { script: 'x' }, 'c2', handler)
        await callTool(mw, 'execute_script', { script: 'y' }, 'c3', handler)

        expect(handler).toHaveBeenCalledTimes(3)
    })

    it('resets the counter on a different tool name', async () => {
        const handler = vi.fn(async () => new ToolMessage({ tool_call_id: 'c1', content: 'ok' }))
        const mw = createLoopGuardMiddleware()

        await callTool(mw, 'execute_script', { script: 'x' }, 'c1', handler)
        await callTool(mw, 'execute_script', { script: 'x' }, 'c2', handler)
        await callTool(mw, 'run_spec', { spec: 'x' }, 'c3', handler)

        expect(handler).toHaveBeenCalledTimes(3)
    })
})
