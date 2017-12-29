import { WDIO_DEFAULTS } from '../src/constants'

describe('constants', () => {
    describe('WDIO_DEFAULTS', () => {
        it('should expect specs to be an array', () => {
            expect(WDIO_DEFAULTS.specs.type('foobar')).toBe(false)
            expect(WDIO_DEFAULTS.specs.type([])).toBe(true)
        })

        it('should expect exclude to be an array', () => {
            expect(WDIO_DEFAULTS.exclude.type('foobar')).toBe(false)
            expect(WDIO_DEFAULTS.exclude.type([])).toBe(true)
        })

        it('should validate reporters correctly', () => {
            expect(WDIO_DEFAULTS.reporters.type('foobar')).toBe(false)
            expect(WDIO_DEFAULTS.reporters.type([false, 'string'])).toBe(false)
            expect(WDIO_DEFAULTS.reporters.type(['string'])).toBe(true)
            expect(WDIO_DEFAULTS.reporters.type([{}])).toBe(false)
            expect(WDIO_DEFAULTS.reporters.type([{ name: 'foobar' }])).toBe(true)
        })
    })

    describe('HOOK_DEFINITION', () => {
        it('should only accept arrays of functions', () => {
            expect(WDIO_DEFAULTS.onPrepare.type()).toBe(false)
            expect(WDIO_DEFAULTS.onPrepare.type([])).toBe(true)
            expect(WDIO_DEFAULTS.onPrepare.type(['foobar'])).toBe(false)
            expect(WDIO_DEFAULTS.onPrepare.type([() => {}])).toBe(true)
            expect(WDIO_DEFAULTS.onPrepare.type([() => {}, 'foobar'])).toBe(false)
        })
    })
})
