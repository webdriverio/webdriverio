import { logHookError } from '../../src/test-framework/errorHandler'

const pSend = jest.spyOn(process, 'send')

describe('logHookError', () => {
    it('should send message if there is Error in results', () => {
        logHookError('BeforeStep', [undefined, true, new Error('foobar')], '0-1')
        expect(pSend).toBeCalledTimes(1)
        expect(pSend).toBeCalledWith({
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
        pSend.mockClear()
    })
})
