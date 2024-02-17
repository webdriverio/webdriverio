import { describe, it, expect } from 'vitest'
import { WDIO_DEFAULTS } from '../src/constants.js'

describe('WDIO_DEFAULTS', () => {
    it('should properly detect automation protocol', () => {
        // @ts-expect-error wrong parameter
        expect(() => WDIO_DEFAULTS.automationProtocol.validate()).toThrow()
        // @ts-expect-error wrong parameter
        expect(() => WDIO_DEFAULTS.automationProtocol!.validate!(123)).toThrow()
        // @ts-expect-error wrong parameter
        expect(() => WDIO_DEFAULTS.automationProtocol!.validate!('foobar')).toThrow()

        WDIO_DEFAULTS.automationProtocol!.validate!('webdriver')
    })
})
