import { describe, expect, it } from 'vitest'
import { createInterruptResolver } from '../src/commands/interrupt.js'

describe('createInterruptResolver', () => {
    it('rejects the approval promise when the prompt interface closes (Ctrl-C)', async () => {
        // fake readline: question never answers; close can be triggered
        let onClose: () => void = () => {}
        const rl = {
            question: (_q: string, _cb: (a: string) => void) => {},
            on: (_ev: string, cb: () => void) => { onClose = cb },
        } as never
        const resolve = createInterruptResolver(rl)
        const pending = resolve({ actionRequests: [{ name: 'write_file', args: {}, description: 'x' }] })
        onClose()
        await expect(pending).rejects.toThrow(/aborted/)
    })

    it('approves a y answer', async () => {
        const rl = {
            question: (_q: string, cb: (a: string) => void) => cb('y'),
            on: () => {},
        } as never
        await expect(createInterruptResolver(rl)({ actionRequests: [] })).resolves.toBe(true)
    })
})
