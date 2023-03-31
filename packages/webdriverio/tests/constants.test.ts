import { describe, it, expect } from 'vitest'
import { WDIO_DEFAULTS } from '../src/constants.js'

class CustomReporter {}

describe('constants', () => {
    describe('WDIO_DEFAULTS', () => {
        it('should expect specs to be an array', () => {
            WDIO_DEFAULTS.specs!.validate!([])
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.specs!.validate!('foobar')).toThrow()
        })

        it('should expect exclude to be an array', () => {
            WDIO_DEFAULTS.exclude!.validate!([])
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.exclude!.validate!('foobar')).toThrow()
        })

        it('should validate reporters correctly', () => {
            WDIO_DEFAULTS.reporters!.validate!(['string'])
            // @ts-expect-error wrong parameter
            WDIO_DEFAULTS.reporters!.validate!([[CustomReporter, {}]])

            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.reporters!.validate!('foobar')).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.reporters!.validate!([false, 'string'])).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.reporters!.validate!([{}])).toThrow()

        })

        it('should validate capabilities correctly', () => {
            WDIO_DEFAULTS.capabilities!.validate!([{}])
            WDIO_DEFAULTS.capabilities!.validate!({})

            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.capabilities!.validate!('foobar')).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.capabilities!.validate!(false)).toThrow()
            expect(() => WDIO_DEFAULTS.capabilities!.validate!([{}, 'foobar'])).toThrow()
        })

        it('should validate services correctly', () => {
            WDIO_DEFAULTS.services!.validate!(['foobar'])
            // @ts-expect-error wrong parameter
            WDIO_DEFAULTS.services!.validate!([[]])
            WDIO_DEFAULTS.services!.validate!([['service', {}], 'foobar'])

            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.services!.validate!('foobar')).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.services!.validate!(false)).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.services!.validate!(['foobar', true])).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.services!.validate!([[], {}])).toThrow()
        })

        it('should expect execArgv to be an array', () => {
            WDIO_DEFAULTS.execArgv!.validate!([])
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.execArgv!.validate!('foobar')).toThrow()
        })

        it('should expect filesToWatch to be an array', () => {
            WDIO_DEFAULTS.filesToWatch!.validate!([])
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.filesToWatch!.validate!('foobar')).toThrow()
        })

        it('should properly detect automation protocol', () => {
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.automationProtocol.validate()).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.automationProtocol!.validate!(123)).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.automationProtocol!.validate!('foobar')).toThrow()

            WDIO_DEFAULTS.automationProtocol!.validate!('webdriver')
            WDIO_DEFAULTS.automationProtocol!.validate!('devtools')
        })
    })

    describe('HOOK_DEFINITION', () => {
        it('should only accept arrays of functions', () => {
            WDIO_DEFAULTS.before!.validate!([])
            WDIO_DEFAULTS.before!.validate!([() => {}])

            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.before!.validate!()).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.before!.validate!(['foobar'])).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => WDIO_DEFAULTS.before!.validate!([() => {}, 'foobar'])).toThrow()
        })
    })
})
