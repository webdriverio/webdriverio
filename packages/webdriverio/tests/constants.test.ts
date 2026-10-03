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

        expect(() => WDIO_DEFAULTS.automationProtocol!.validate!('somethingelse'))
            .toThrow('Couldn\'t find automation protocol "somethingelse"')
        expect(() => WDIO_DEFAULTS.automationProtocol!.validate!('webdriver')).not.toThrow()
    })

    it('should keep and check maxSpyCollectedBodySize', () => {
        expect(WDIO_DEFAULTS.maxSpyCollectedBodySize?.type).toBe('number')
        expect(() => WDIO_DEFAULTS.maxSpyCollectedBodySize!.validate!(0)).not.toThrow()
        expect(() => WDIO_DEFAULTS.maxSpyCollectedBodySize!.validate!(1024)).not.toThrow()
        expect(() => WDIO_DEFAULTS.maxSpyCollectedBodySize!.validate!(-1)).toThrow('an integer of 0 or more')
        expect(() => WDIO_DEFAULTS.maxSpyCollectedBodySize!.validate!(1.5)).toThrow('an integer of 0 or more')
    })
})

describe('restoreFunctions', () => {
    it('does not strongly retain browser instances used for emulation', () => {
        expect(restoreFunctions).toBeInstanceOf(WeakMap)
    })
})
