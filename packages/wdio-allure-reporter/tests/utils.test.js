import process from 'process'
import CompoundError from '../src/compoundError'
import { getTestStatus, isEmpty, tellReporter, isMochaEachHooks, getErrorFromFailedTest, isMochaAllHooks, getLinkByTemplate } from '../src/utils'
import { linkPlaceholder, testStatuses } from '../src/constants'

describe('utils', () => {
    let processEmit
    beforeAll(() => {
        processEmit = process.emit.bind(process)
        process.emit = jest.fn()
    })

    afterAll(() => {
        process.emit = processEmit
    })

    describe('getTestStatus', () => {
        it('return  status for jasmine', () => {
            expect(getTestStatus({}, { framework: 'jasmine' })).toEqual(testStatuses.FAILED)
        })

        it('failed for AssertionError', () => {
            const config = { framework: 'mocha' }
            const test = { error: { name: 'AssertionError' } }
            expect(getTestStatus(test, config)).toEqual(testStatuses.FAILED)
        })

        it('failed for AssertionError stacktrace', () => {
            const config = { framework: 'mocha' }
            const test = { error: { stack: 'AssertionError' } }
            expect(getTestStatus(test, config)).toEqual(testStatuses.FAILED)
        })

        it('broken for not AssertionError', () => {
            const config = { framework: 'mocha' }
            const test = { error: { name: 'MyError' } }
            expect(getTestStatus(test, config)).toEqual(testStatuses.BROKEN)
        })

        it('broken for error without stacktrace', () => {
            const config = { framework: 'mocha' }
            const test = { error: {} }
            expect(getTestStatus(test, config)).toEqual(testStatuses.BROKEN)
        })

        it('failed status for not AssertionError stacktrace', () => {
            const config = { framework: 'mocha' }
            const test = { error: { stack: 'MyError stack trace' } }
            expect(getTestStatus(test, config)).toEqual(testStatuses.BROKEN)
        })
    })

    it('isMochaEachHooks filter hook by title', () => {
        expect(isMochaEachHooks('"before all" hook')).toEqual(false)
        expect(isMochaEachHooks('"after all" hook')).toEqual(false)
        expect(isMochaEachHooks('"before each" hook')).toEqual(true)
        expect(isMochaEachHooks('"after each" hook')).toEqual(true)
    })

    describe('isEmpty', () => {
        it('should filter empty objects', () => {
            expect(isEmpty({})).toEqual(true)
            expect(isEmpty([])).toEqual(true)
            expect(isEmpty(undefined)).toEqual(true)
            expect(isEmpty(null)).toEqual(true)
            expect(isEmpty('')).toEqual(true)
        })
    })

    describe('isMochaHooks', () => {
        it('should filter hook by title', () => {
            expect(isMochaEachHooks('"before all" hook')).toEqual(false)
            expect(isMochaEachHooks('"after all" hook')).toEqual(false)
            expect(isMochaEachHooks('"before each" hook')).toEqual(true)
            expect(isMochaEachHooks('"after each" hook')).toEqual(true)

            expect(isMochaAllHooks('"before all" hook')).toEqual(true)
            expect(isMochaAllHooks('"after all" hook')).toEqual(true)
            expect(isMochaAllHooks('"before each" hook')).toEqual(false)
            expect(isMochaAllHooks('"after each" hook')).toEqual(false)
        })
    })

    describe('tellReporter', () => {
        afterEach(() => {
            process.emit.mockClear()
        })

        it('should accept message', () => {
            tellReporter('foo', { bar: 'baz' })
            expect(process.emit).toHaveBeenCalledTimes(1)
            expect(process.emit).toHaveBeenCalledWith('foo', { bar: 'baz' })
        })

        it('should accept no message', () => {
            tellReporter('foo')
            expect(process.emit).toHaveBeenCalledTimes(1)
            expect(process.emit).toHaveBeenCalledWith('foo', {})
        })
    })

    describe('getErrorFromFailedTest', () => {
        // wdio-mocha-framework returns a single 'error', while wdio-jasmine-framework returns an array of 'errors'
        it('should return just the error property when there is no errors property', () => {
            const testStat = {
                error: new Error('Everything is Broken Forever')
            }
            expect(getErrorFromFailedTest(testStat).message).toBe('Everything is Broken Forever')
        })

        it('should return a single error when there is an errors array with one error', () => {
            const testStat = {
                errors: [new Error('Everything is Broken Forever')],
                error: new Error('Everything is Broken Forever')
            }
            expect(getErrorFromFailedTest(testStat).message).toBe('Everything is Broken Forever')
        })

        it('should return a CompoundError of the errors when there is more than one error', () => {
            const testStat = {
                errors: [new Error('Everything is Broken Forever'), new Error('Additional things are broken')],
                error: new Error('Everything is Broken Forever')
            }
            expect(getErrorFromFailedTest(testStat) instanceof CompoundError).toBe(true)
            expect(getErrorFromFailedTest(testStat).innerErrors).toEqual(testStat.errors)
        })
    })

    describe('getLinkByTemplate', () => {
        const template = 'https://youtrack.jetbrains.com/issue/{}'
        const id = 'JIRA-42'
        it('should return link with task id', () => {
            const link = getLinkByTemplate(template, id)
            expect(link).toEqual('https://youtrack.jetbrains.com/issue/JIRA-42')
        })

        it('should return id if template is not a string', () => {
            expect(getLinkByTemplate(undefined, id)).toEqual(id)
            expect(getLinkByTemplate({}, id)).toEqual(id)
        })

        it('should throw error if template is invalid', () => {
            const template = 'foo'
            expect(() => getLinkByTemplate(template, id))
                .toThrow(`The link template "${template}" must contain ${linkPlaceholder} substring.`)
        })
    })
})

