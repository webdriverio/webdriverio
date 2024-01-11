import { describe, it, expect } from 'vitest'
import { TESTRUNNER_DEFAULTS } from '../src/constants.js'

import { convertPackageHashToObject } from '../src/utils.js'
import { SUPPORTED_PACKAGES } from '../src/constants.js'

const supportedInstallations = [
    ...SUPPORTED_PACKAGES.runner.map(({ value }) => convertPackageHashToObject(value)),
    ...SUPPORTED_PACKAGES.plugin.map(({ value }) => convertPackageHashToObject(value)),
    ...SUPPORTED_PACKAGES.service.map(({ value }) => convertPackageHashToObject(value)),
    ...SUPPORTED_PACKAGES.reporter.map(({ value }) => convertPackageHashToObject(value)),
    ...SUPPORTED_PACKAGES.framework.map(({ value }) => convertPackageHashToObject(value))
]

class CustomReporter {}

describe('constants', () => {
    describe('plugin list', () => {
        it('should provide all a short name', () => {
            const pluginsWithoutShorts = supportedInstallations.filter((plugin) => !plugin.short)
            expect(pluginsWithoutShorts).toHaveLength(0)
        })
    })

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

            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.capabilities!.validate!('foobar')).toThrow()
            // @ts-expect-error wrong parameter
            expect(() => TESTRUNNER_DEFAULTS.capabilities!.validate!(false)).toThrow()
            // @ts-expect-error wrong parameter
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
