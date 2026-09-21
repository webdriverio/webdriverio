import { describe, it, expect, vi } from 'vitest'
import { WDIO_DEFAULTS, restoreFunctions } from '../src/constants.js'

vi.mock('import-meta-resolve', () => ({
    resolve: vi.fn()
}))

describe('WDIO_DEFAULTS', () => {
    it('should properly detect automation protocol', () => {
        // @ts-expect-error wrong parameter
        expect(() => WDIO_DEFAULTS.automationProtocol.validate()).toThrow()
        // @ts-expect-error wrong parameter
        expect(() => WDIO_DEFAULTS.automationProtocol!.validate!(123)).toThrow()

        WDIO_DEFAULTS.automationProtocol!.validate!('somethingelse')
        WDIO_DEFAULTS.automationProtocol!.validate!('webdriver')
    })
})

describe('restoreFunctions', () => {
    it('does not strongly retain browser instances used for emulation', () => {
        expect(restoreFunctions).toBeInstanceOf(WeakMap)
    })
})
