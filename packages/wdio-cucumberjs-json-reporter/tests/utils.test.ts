import { describe, it, expect } from 'vitest'

import { TEST_SCENARIO_STATS, TEST_SCENARIO_STATS_ERROR } from './__mocks__/mocks.js'
import { getFailedMessage, containsSteps, getStepStatus, keywordStartsWith } from '../src/utils.js'

describe('utils', () => {
    describe('getFailedMessage', () => {
        it('should not return an error message if the status is "passed"', () => {
            expect(getFailedMessage(TEST_SCENARIO_STATS)).toEqual({})
        })

        it('should return an error message if the status is "failed"', () => {
            expect(getFailedMessage(TEST_SCENARIO_STATS_ERROR)).toMatchSnapshot()
        })
    })

    describe('containsSteps', () => {
        it('should return false if none of the values is a step name', () => {
            const steps = [
                { keyword: 'foo' },
                { keyword: 'bar' },
                { keyword: 'foobar' },
            ]
            const language = 'en'
            expect(containsSteps(steps, language)).toEqual(false)
        })

        it('should return true if step contains the word `Given`', () => {
            const steps = [
                { keyword: 'foo' },
                { keyword: 'bar' },
                { keyword: 'Given' },
            ]
            const language = 'en'
            expect(containsSteps(steps, language)).toEqual(true)
        })

        it('should return true if step contains the word `When`', () => {
            const steps = [
                { keyword: 'When' },
                { keyword: 'bar' },
                { keyword: 'foo' },
            ]
            const language = 'en'
            expect(containsSteps(steps, language)).toEqual(true)
        })

        it('should return true if step contains the word `Then`', () => {
            const steps = [
                { keyword: 'bar' },
                { keyword: 'Then' },
                { keyword: 'foo' },
            ]
            const language = 'en'
            expect(containsSteps(steps, language)).toEqual(true)
        })

        it('should return true if step contains the word `And`', () => {
            const steps = [
                { keyword: 'bar' },
                { keyword: 'And' },
            ]
            const language = 'en'
            expect(containsSteps(steps, language)).toEqual(true)
        })
    })

    describe('keywordStartsWith', () => {
        it('should return undefined if the first word is not a keyword', () => {
            const language = 'en'

            expect(keywordStartsWith('Milk is not a reserved keyword', language)).toBeUndefined()
        })

        it('should return the first word if it is a keyword', () => {
            const language = 'en'

            // * is a valid keyword in Gherkin
            expect(keywordStartsWith('* I have milk', language)).toEqual('*')
        })

        it('knows the But keyword', () => {
            expect(keywordStartsWith('But I have no milk', 'en')).toEqual('But')
        })
    })
})

describe('getStepStatus', () => {
    const step = (state: string, title: string, message?: string) =>
        ({ state, title, error: message === undefined ? undefined : new Error(message) }) as unknown as Parameters<typeof getStepStatus>[0]

    it('gives the status of the framework', () => {
        expect(getStepStatus(step('passed', 'Given a step'))).toBe('passed')
        expect(getStepStatus(step('failed', 'Given a step', 'expected 1 to be 2'))).toBe('failed')
        expect(getStepStatus(step('skipped', 'Given a step'))).toBe('skipped')
        expect(getStepStatus(step('pending', 'Given a step'))).toBe('pending')
    })

    it('gives "undefined" for an undefined step, also with ignoreUndefinedDefinitions', () => {
        const error = 'Step "a step" is not defined. You can ignore this error by setting cucumberOpts.ignoreUndefinedDefinitions as true.'
        expect(getStepStatus(step('failed', 'Given a step', error))).toBe('undefined')
        expect(getStepStatus(step('pending', 'Given a step (undefined step)'))).toBe('undefined')
    })

    it('keeps "failed" for a step whose own error looks like these messages', () => {
        expect(getStepStatus(step('failed', 'Given a step', 'Step "a" is not defined in the page'))).toBe('failed')
    })
})

describe('getFailedMessage without a stack', () => {
    it('uses the error message when the error has no stack', () => {
        expect(getFailedMessage({ state: 'failed', error: { message: 'boom' } } as never)).toEqual({ error_message: 'boom' })
    })
})
