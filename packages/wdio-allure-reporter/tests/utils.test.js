import process from 'process'
import {getTestStatus, ignoredHooks, isEmpty, tellReporter} from '../src/utils'
import {testStatuses} from '../src/constants'

jest.mock('process')

describe('utils#getTestStatus', () => {
    it('return  status for jasmine', () => {
        expect(getTestStatus({}, {framework: 'jasmine'})).toEqual(testStatuses.FAILED)
    })

    it('failed for AssertionError', () => {
        const config = {framework: 'mocha'}
        const test = {error: {name: 'AssertionError'}}
        expect(getTestStatus(test, config)).toEqual(testStatuses.FAILED)
    })

    it('failed for AssertionError stacktrace', () => {
        const config = {framework: 'mocha'}
        const test = {error: {stack: 'AssertionError'}}
        expect(getTestStatus(test, config)).toEqual(testStatuses.FAILED)
    })

    it('broken for not AssertionError', () => {
        const config = {framework: 'mocha'}
        const test = {error: {name: 'MyError'}}
        expect(getTestStatus(test, config)).toEqual(testStatuses.BROKEN)
    })

    it('failed status for not AssertionError stacktrace', () => {
        const config = {framework: 'mocha'}
        const test = {error: {stack: 'MyError stack trace'}}
        expect(getTestStatus(test, config)).toEqual(testStatuses.BROKEN)
    })
})

describe('utils', () => {
    it('ignoredHook filter hook by title', () => {
        expect(ignoredHooks('"before all" hook')).toEqual(true)
        expect(ignoredHooks('"after all" hook')).toEqual(true)
        expect(ignoredHooks('"before each" hook')).toEqual(true)
        expect(ignoredHooks('"after each" hook')).toEqual(true)
    })

    it('isEmpty filter empty objects', () => {
        expect(isEmpty({})).toEqual(true)
        expect(isEmpty([])).toEqual(true)
        expect(isEmpty(undefined)).toEqual(true)
        expect(isEmpty(null)).toEqual(true)
        expect(isEmpty('')).toEqual(true)
    })

    it('tellReporter', () => {
        tellReporter('foo', {bar: 'baz'})
        expect(process.emit).toHaveBeenCalledTimes(1)
        expect(process.emit).toHaveBeenCalledWith('foo', {bar: 'baz'})
    })
})

