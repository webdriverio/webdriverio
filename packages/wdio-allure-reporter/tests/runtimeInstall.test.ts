import { afterEach, describe, expect, it, vi } from 'vitest'

const KEY = 'allureTestRuntime'
const globals = globalThis as Record<string, unknown>

describe('api runtime install', () => {
    afterEach(() => {
        delete globals[KEY]
        vi.resetModules()
    })

    it('installs a runtime when none exists', async () => {
        delete globals[KEY]
        await import('../src/common/api.js')
        expect(typeof globals[KEY]).toBe('function')
    })

    it('does not override an existing runtime', async () => {
        const existing = () => undefined
        globals[KEY] = existing
        await import('../src/common/api.js')
        expect(globals[KEY]).toBe(existing)
    })
})
