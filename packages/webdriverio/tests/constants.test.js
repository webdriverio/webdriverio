import { WDIO_DEFAULTS } from '../src/constants'

describe('constants', () => {
    describe('WDIO_DEFAULTS', () => {
        it('should expect specs to be an array', () => {
            WDIO_DEFAULTS.specs.type([])
            expect(() => WDIO_DEFAULTS.specs.type('foobar')).toThrow()
        })

        it('should expect exclude to be an array', () => {
            WDIO_DEFAULTS.exclude.type([])
            expect(() => WDIO_DEFAULTS.exclude.type('foobar')).toThrow()
        })

        it('should validate reporters correctly', () => {
            WDIO_DEFAULTS.reporters.type(['string'])
            WDIO_DEFAULTS.reporters.type([{ name: 'foobar' }])

            expect(() => WDIO_DEFAULTS.reporters.type('foobar')).toThrow()
            expect(() => WDIO_DEFAULTS.reporters.type([false, 'string'])).toThrow()
            expect(() => WDIO_DEFAULTS.reporters.type([{}])).toThrow()

        })
    })

    describe('HOOK_DEFINITION', () => {
        it('should only accept arrays of functions', () => {
            WDIO_DEFAULTS.onPrepare.type([])
            WDIO_DEFAULTS.onPrepare.type([() => {}])

            expect(() => WDIO_DEFAULTS.onPrepare.type()).toThrow()
            expect(() => WDIO_DEFAULTS.onPrepare.type(['foobar'])).toThrow()
            expect(() => WDIO_DEFAULTS.onPrepare.type([() => {}, 'foobar'])).toThrow()
        })
    })
})
