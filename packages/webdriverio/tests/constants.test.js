import { WDIO_DEFAULTS } from '../src/constants'

class CustomReporter {}

describe('constants', () => {
    describe('WDIO_DEFAULTS', () => {
        it('should expect specs to be an array', () => {
            WDIO_DEFAULTS.specs.validate([])
            expect(() => WDIO_DEFAULTS.specs.validate('foobar')).toThrow()
        })

        it('should expect exclude to be an array', () => {
            WDIO_DEFAULTS.exclude.validate([])
            expect(() => WDIO_DEFAULTS.exclude.validate('foobar')).toThrow()
        })

        it('should validate reporters correctly', () => {
            WDIO_DEFAULTS.reporters.validate(['string'])
            WDIO_DEFAULTS.reporters.validate([[CustomReporter, {}]])

            expect(() => WDIO_DEFAULTS.reporters.validate('foobar')).toThrow()
            expect(() => WDIO_DEFAULTS.reporters.validate([false, 'string'])).toThrow()
            expect(() => WDIO_DEFAULTS.reporters.validate([{}])).toThrow()

        })

        it('should validate capabilities correctly', () => {
            WDIO_DEFAULTS.capabilities.validate([{}])
            WDIO_DEFAULTS.capabilities.validate({})

            expect(() => WDIO_DEFAULTS.capabilities.validate('foobar')).toThrow()
            expect(() => WDIO_DEFAULTS.capabilities.validate(false)).toThrow()
            expect(() => WDIO_DEFAULTS.capabilities.validate([{}, 'foobar'])).toThrow()
        })

        it('should validate services correctly', () => {
            WDIO_DEFAULTS.services.validate(['foobar'])
            WDIO_DEFAULTS.services.validate([[]])
            WDIO_DEFAULTS.services.validate([['service', {}], 'foobar'])

            expect(() => WDIO_DEFAULTS.services.validate('foobar')).toThrow()
            expect(() => WDIO_DEFAULTS.services.validate(false)).toThrow()
            expect(() => WDIO_DEFAULTS.services.validate(['foobar', true])).toThrow()
            expect(() => WDIO_DEFAULTS.services.validate([[], {}])).toThrow()
        })

        it('should expect execArgv to be an array', () => {
            WDIO_DEFAULTS.execArgv.validate([])
            expect(() => WDIO_DEFAULTS.execArgv.validate('foobar')).toThrow()
        })

        it('should expect filesToWatch to be an array', () => {
            WDIO_DEFAULTS.filesToWatch.validate([])
            expect(() => WDIO_DEFAULTS.filesToWatch.type('foobar')).toThrow()
        })

        it('should properly detect automation protocol', () => {
            expect(() => WDIO_DEFAULTS.automationProtocol.validate()).toThrow()
            expect(() => WDIO_DEFAULTS.automationProtocol.validate(123)).toThrow()
            expect(() => WDIO_DEFAULTS.automationProtocol.validate('foobar')).toThrow()
            WDIO_DEFAULTS.automationProtocol.validate('webdriver')
            WDIO_DEFAULTS.automationProtocol.validate('devtools')
        })
    })

    describe('HOOK_DEFINITION', () => {
        it('should only accept arrays of functions', () => {
            WDIO_DEFAULTS.before.validate([])
            WDIO_DEFAULTS.before.validate([() => {}])

            expect(() => WDIO_DEFAULTS.before.validate()).toThrow()
            expect(() => WDIO_DEFAULTS.before.validate(['foobar'])).toThrow()
            expect(() => WDIO_DEFAULTS.before.validate([() => {}, 'foobar'])).toThrow()
        })
    })
})
