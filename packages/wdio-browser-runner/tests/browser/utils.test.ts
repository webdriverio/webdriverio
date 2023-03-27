import { vi, describe, it, beforeAll, afterAll, expect } from 'vitest'
import { showPopupWarning } from '../../src/browser/utils.js'

describe('browser utils', () => {
    const consoleWarn = console.warn.bind(console)
    beforeAll(() => {
        console.warn = vi.fn()
        globalThis.alert = showPopupWarning('alert', undefined)
        globalThis.confirm = showPopupWarning('confirm', false, true)
        globalThis.prompt = showPopupWarning('prompt', null, 'your value')
    })

    it('showPopupWarning', () => {
        expect(alert('test')).toBeUndefined()
        expect(prompt('test')).toBeNull()
        expect(confirm('test')).toBe(false)
        expect(console.warn).toBeCalledTimes(3)
    })

    afterAll(() => {
        console.warn = consoleWarn
    })
})
