import { describe, it, expect } from 'vitest'

import { getParallelContextStore } from '../../src/session/context.js'

describe('parallel context store default', () => {
    it('is a no-op store that just runs the callback', () => {
        const store = getParallelContextStore()
        expect(store.getStore()).toBeUndefined()
        expect(store.run('ctx', () => store.getStore())).toBeUndefined()
        expect(store.run('ctx', () => 42)).toBe(42)
    })
})
