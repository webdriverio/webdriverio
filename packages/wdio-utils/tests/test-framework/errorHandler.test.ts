import { vi, describe, it, afterEach, expect } from 'vitest'
import { logHookError } from '../../src/test-framework/errorHandler.js'

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

    afterEach(() => {
        vi.mocked(process.send!).mockClear()
    })
})
