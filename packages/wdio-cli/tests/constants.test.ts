import { describe, it, expect } from 'vitest'
import { TESTRUNNER_DEFAULTS } from '../src/constants.js'

class CustomReporter {}

describe('constants', () => {

    describe('TESTRUNNER_DEFAULTS', () => {
        it('should expect specs to be an array', () => {
            TESTRUNNER_DEFAULTS.specs!.validate!([])
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.specs!.validate!('foobar')).toThrow()
        })

        it('should expect exclude to be an array', () => {
            TESTRUNNER_DEFAULTS.exclude!.validate!([])
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.exclude!.validate!('foobar')).toThrow()
        })

        it('should validate reporters correctly', () => {
            TESTRUNNER_DEFAULTS.reporters!.validate!(['string'])
            // @ts-expect-error wrong parameter
            TESTRUNNER_DEFAULTS.reporters!.validate!([[CustomReporter, {}]])

            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.reporters!.validate!('foobar')).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.reporters!.validate!([false, 'string'])).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.reporters!.validate!([{}])).toThrow()

        })

        it('should validate capabilities correctly', () => {
            TESTRUNNER_DEFAULTS.capabilities!.validate!([{}])
            TESTRUNNER_DEFAULTS.capabilities!.validate!({})

            expect(() => TESTRUNNER_DEFAULTS.capabilities!.validate!('foobar')).toThrow()
            expect(() => TESTRUNNER_DEFAULTS.capabilities!.validate!(false)).toThrow()
            expect(() => TESTRUNNER_DEFAULTS.capabilities!.validate!([{}, 'foobar'])).toThrow()
        })

        it('should validate services correctly', () => {
            TESTRUNNER_DEFAULTS.services!.validate!(['foobar'])
            // @ts-expect-error wrong parameter
            TESTRUNNER_DEFAULTS.services!.validate!([[]])
            TESTRUNNER_DEFAULTS.services!.validate!([['service', {}], 'foobar'])

            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.services!.validate!('foobar')).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.services!.validate!(false)).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.services!.validate!(['foobar', true])).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.services!.validate!([[], {}])).toThrow()
        })

        it('should expect execArgv to be an array', () => {
            TESTRUNNER_DEFAULTS.execArgv!.validate!([])
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.execArgv!.validate!('foobar')).toThrow()
        })

        it('should expect a one-based shard (#16240)', () => {
            TESTRUNNER_DEFAULTS.shard!.validate!({ current: 1, total: 4 })
            TESTRUNNER_DEFAULTS.shard!.validate!({ current: 4, total: 4 })

            expect(() => TESTRUNNER_DEFAULTS.shard!.validate!({ current: 0, total: 4 }))
                .toThrow('the "shard.current" value has to be an integer between 1 and "shard.total"')
            expect(() => TESTRUNNER_DEFAULTS.shard!.validate!({ current: 5, total: 4 })).toThrow()
            expect(() => TESTRUNNER_DEFAULTS.shard!.validate!({ current: 1.5, total: 4 })).toThrow()
            expect(() => TESTRUNNER_DEFAULTS.shard!.validate!({ current: 0, total: 0 }))
                .toThrow('the "shard.total" value has to be a positive integer')
            expect(() => TESTRUNNER_DEFAULTS.shard!.validate!({ current: 1, total: 2.5 })).toThrow()
        })

        it('should expect filesToWatch to be an array', () => {
            TESTRUNNER_DEFAULTS.filesToWatch!.validate!([])
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.filesToWatch!.validate!('foobar')).toThrow()
        })
    })

    describe('HOOK_DEFINITION', () => {
        it('should only accept arrays of functions', () => {
            TESTRUNNER_DEFAULTS.before!.validate!([])
            TESTRUNNER_DEFAULTS.before!.validate!([() => {}])

            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.before!.validate!()).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.before!.validate!(['foobar'])).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.before!.validate!([() => {}, 'foobar'])).toThrow()
        })
    })
})
