import { describe, expect, it, vi } from 'vitest'

import { initSession } from '../../src/daemon/init.js'
import type { Session } from '../../src/session.js'

const session = (selectorProviders: unknown[], addLocatorStrategy = vi.fn()) => ({
    plan: { selectorProviders },
    browser: { addLocatorStrategy },
    history: { append: vi.fn() },
    isWeb: false
}) as unknown as Session

describe('initSession selector providers', () => {
    it('registers the locator of each provider, method shorthand included', async () => {
        const addLocatorStrategy = vi.fn()
        await initSession(session([
            { name: 'length', locator: '(arg) => arg.length' },
            { name: 'ui5', locator: 'async locator(arg) { return [arg] }' },
            { name: 'attr', attributes: ['data-e2e'] }
        ], addLocatorStrategy))

        expect(addLocatorStrategy.mock.calls.map(([name]) => name)).toEqual(['length', 'ui5'])
        const [length, ui5] = addLocatorStrategy.mock.calls.map(([, locator]) => locator)
        expect(length('abc')).toBe(3)
        await expect(ui5('x')).resolves.toEqual(['x'])
        expect(() => new Function(`return (${String(ui5)})`)).not.toThrow()
    })

    it('warns instead of failing the session when a locator name is taken', async () => {
        const addLocatorStrategy = vi.fn(() => {
            throw new Error('Strategy ui5 already exists')
        })
        await expect(initSession(session([{ name: 'ui5', locator: '(arg) => arg' }], addLocatorStrategy))).resolves.toBeUndefined()
        expect(addLocatorStrategy).toHaveBeenCalledOnce()
    })
})
