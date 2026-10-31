import { describe, it, expect } from 'vitest'

import '../../src/node.js'
import { getParallelContextStore } from '../../src/session/context.js'

describe('node entry', () => {
    it('registers an AsyncLocalStorage-backed parallel context store', async () => {
        const store = getParallelContextStore()
        expect(store.getStore()).toBeUndefined()
        await store.run('ctx-1', async () => {
            await Promise.resolve()
            expect(store.getStore()).toBe('ctx-1')
        })
        expect(store.getStore()).toBeUndefined()
    })
})
