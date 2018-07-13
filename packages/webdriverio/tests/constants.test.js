import { WDIO_DEFAULTS } from '../src/constants'

class CustomReporter {}

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
            WDIO_DEFAULTS.reporters.type([[CustomReporter, {}]])

            expect(() => WDIO_DEFAULTS.reporters.type('foobar')).toThrow()
            expect(() => WDIO_DEFAULTS.reporters.type([false, 'string'])).toThrow()
            expect(() => WDIO_DEFAULTS.reporters.type([{}])).toThrow()

        })
    })

    describe('HOOK_DEFINITION', () => {
        it('should only accept arrays of functions', () => {
            WDIO_DEFAULTS.before.type([])
            WDIO_DEFAULTS.before.type([() => {}])

            expect(() => WDIO_DEFAULTS.before.type()).toThrow()
            expect(() => WDIO_DEFAULTS.before.type(['foobar'])).toThrow()
            expect(() => WDIO_DEFAULTS.before.type([() => {}, 'foobar'])).toThrow()
        })
    })
})
