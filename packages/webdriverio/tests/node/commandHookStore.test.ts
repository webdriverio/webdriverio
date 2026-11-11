import { describe, it, expect, vi } from 'vitest'
import type * as utils from '@wdio/utils'

const { setCommandHookStore } = vi.hoisted(() => ({ setCommandHookStore: vi.fn() }))
vi.mock('@wdio/utils', async (importOriginal) => ({
    ...(await importOriginal<typeof utils>()),
    setCommandHookStore
}))

describe('node entry', () => {
    it('registers an AsyncLocalStorage-backed command hook store', async () => {
        vi.resetModules()
        await import('../../src/node.js')
        expect(setCommandHookStore).toBeCalledTimes(1)
        const store = setCommandHookStore.mock.calls[0][0]
        expect(store.getStore()).toBeUndefined()
        await store.run(true, async () => {
            await Promise.resolve()
            expect(store.getStore()).toBe(true)
        })
        expect(store.getStore()).toBeUndefined()
    })
})
