import { it, expect, vi, beforeEach, describe, afterEach } from 'vitest'
import newWindow from '../../src/scripts/newWindow.js'

describe('newWindow script', () => {
    beforeEach(() => {
        global.window = { open: vi.fn() } as any
    })

    it('should check if elem is active', () => {
        newWindow('foo', 'bar', 'loo')
        expect(vi.mocked(global.window.open).mock.calls).toHaveLength(1)
        expect(vi.mocked(global.window.open).mock.calls[0]).toEqual(['foo', 'bar', 'loo'])
    })

    afterEach(() => {
        // @ts-expect-error
        delete global.window
    })
})
