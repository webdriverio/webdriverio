import { vi, describe, it, afterEach, expect } from 'vitest'
import { logHookError, findSevereServiceError } from '../../src/test-framework/errorHandler.js'

process.send = vi.fn()

describe('logHookError', () => {
    it('should send message if there is Error in results', () => {
        logHookError('BeforeStep', [undefined, true, new Error('foobar')], '0-1')
        expect(process.send).toBeCalledTimes(1)
        expect(process.send).toBeCalledWith({
            name: 'printFailureMessage',
            origin: 'reporter',
            content: {
                cid: '0-1',
                fullTitle: 'BeforeStep Hook',
                state: 'fail',
                type: 'hook',
                error: expect.objectContaining({ message: 'foobar' }),
            },
        })
    })

    describe('findSevereServiceError', () => {
        it('should find an error by its name', () => {
            const severe = Object.assign(new Error('foobar'), { name: 'SevereServiceError' })
            expect(findSevereServiceError([undefined, new Error('other'), severe])).toBe(severe)
        })

        it('should ignore other results', () => {
            expect(findSevereServiceError([undefined, 'SevereServiceError', new Error('other')])).toBeUndefined()
            expect(findSevereServiceError()).toBeUndefined()
        })
    })

    afterEach(() => {
        vi.mocked(process.send!).mockClear()
    })
})
