import { describe, it, expect, beforeEach } from 'vitest'
import CompoundError from '../src/compoundError'

describe('CompoundError', () => {
    let e1: Error
    let e2: Error

    beforeEach(() => {
        try {
            throw new Error('Everything is awful')
        } catch (err: any) {
            e1 = err
        }
        try {
            throw new Error('I am so sad')
        } catch (err: any) {
            e2 = err
        }
    })

    it('should have a message header', () => {
        const compoundErr = new CompoundError(e1, e2)
        const lines = compoundErr.message.split('\n')
        expect(lines[0]).toBe('CompoundError: One or more errors occurred. ---')
    })

    it('should combine error messages from each error', () => {
        const compoundErr = new CompoundError(e1, e2)
        const lines = compoundErr.message.split('\n')
        expect(lines).toContain('    Error: Everything is awful')
        expect(lines).toContain('    Error: I am so sad')
    })

    it('should include stack traces from the errors', () => {
        const compoundErr = new CompoundError(e1, e2)
        const lines = compoundErr.message.split('\n').map(x => x.substr(4))

        // This is a little dense, but essentially, CompoundError's messages look like
        //
        // IntroMessage
        // EndOfStackMessage
        // Separator
        // SecondStack
        // EndOfStackMessage

        // So we split both the final CompoundError message
        // and the traces that compose it on line separators and then test to make sure that
        // the split traces are in the appropriate places in the CompoundError message.
        // We do this rather than hard-coding strings, so we can use actual error stacks (which might be slightly)
        // different depending on how we run the tests.

        const e1split = e1.stack?.split('\n')
        const e2split = e2.stack?.split('\n')
        const startOfFirstStack = 2
        const endOfFirstStack = (e1split?.length || 0) + startOfFirstStack
        const startOfSecondStack = endOfFirstStack + startOfFirstStack
        const endOfSecondStack = startOfSecondStack + (e2split?.length || 0)
        expect(lines.slice(startOfFirstStack, endOfFirstStack)).toEqual(e1split)
        expect(lines.slice(startOfSecondStack, endOfSecondStack)).toEqual(e2split)
    })

    it('should include delimiters to indicate where stack traces end', () => {
        const compoundErr = new CompoundError(e1, e2)
        const lines = compoundErr.message.split('\n')

        expect(lines).toContain('--- End of stack trace ---')
    })

    it('should not explode if the stack property is undefined one an error', () => {
        e1 = { message: 'goodbye' } as any
        e2 = { message: 'hello' }as any

        expect(() => new CompoundError(e1, e2)).not.toThrow()
    })

    it('should combine messages if stacks are not available for some reason', () => {
        e1 = { message: 'goodbye' }as any
        e2 = { message: 'hello' }as any
        const error = new CompoundError(e1, e2)
        const lines = error.message.split('\n')

        expect(lines[0]).toBe('CompoundError: One or more errors occurred. ---')
        expect(lines[2]).toBe('   goodbye')
        expect(lines[3]).toBe('--- End of error message ---')
        expect(lines[5]).toBe('   hello')
        expect(lines[6]).toBe('--- End of error message ---')
    })
})
