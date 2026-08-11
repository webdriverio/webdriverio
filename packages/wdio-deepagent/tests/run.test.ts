import { describe, expect, it, vi } from 'vitest'
import { runMission } from '../src/commands/run.js'
import { processTurn } from '../src/commands/turn.js'

vi.mock('../src/commands/turn.js', () => ({
    processTurn: vi.fn(),
}))

const ok = { reply: 'all good', toolCalls: [], failedToolIds: [] }

describe('runMission exit-code contract', () => {
    it('exits 0 on a successful turn', async () => {
        vi.mocked(processTurn).mockResolvedValue(ok)
        const result = await runMission({} as never, 'go')
        expect(result.exitCode).toBe(0)
    })

    it('exits 1 when the turn ends on a failed tool invocation', async () => {
        vi.mocked(processTurn).mockResolvedValue({ ...ok, failedToolIds: ['call-1'] })
        const result = await runMission({} as never, 'go')
        expect(result.exitCode).toBe(1)
        expect(result.toolCalls).toEqual([])
    })

    it('exits 1 when the agent ends with no final answer', async () => {
        vi.mocked(processTurn).mockResolvedValue({ reply: '   ', toolCalls: [], failedToolIds: [] })
        const result = await runMission({} as never, 'go')
        expect(result.exitCode).toBe(1)
    })

    it('exits 1 when the turn throws', async () => {
        vi.mocked(processTurn).mockRejectedValue(new Error('provider timeout'))
        const result = await runMission({} as never, 'go')
        expect(result.exitCode).toBe(1)
    })

    it('passes the interrupt resolver through to processTurn', async () => {
        const resolveInterrupt = vi.fn(async () => true)
        vi.mocked(processTurn).mockResolvedValue(ok)
        await runMission({} as never, 'go', { resolveInterrupt })
        expect(processTurn).toHaveBeenCalledWith({}, 'go', { resolveInterrupt })
    })
})
