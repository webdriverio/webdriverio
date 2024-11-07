import RequestQueueHandler from '../src/request-handler'
import { TESTOPS_BUILD_COMPLETED_ENV } from '../src/constants'

jest.useFakeTimers()

describe('RequestQueueHandler', () => {
    const mockHandler = jest.fn()

    afterEach(() => {
        jest.resetAllMocks()
    })

    describe('add', () => {
        const requestQueueHandler = RequestQueueHandler.getInstance(mockHandler)

        it('throws error if BS_TESTOPS_BUILD_COMPLETED not present', () => {
            delete process.env[TESTOPS_BUILD_COMPLETED_ENV]
            expect(() => requestQueueHandler.add({ event_type: 'there' })).toThrowError()
        })

        it('if event_type in BATCH_EVENT_TYPES', () => {
            process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
            expect(() => requestQueueHandler.add({ event_type: 'LogCreated', logs: [{ kind: 'HTTP' }] })).not.toThrowError()
        })
    })

    describe('shouldProceed', () => {
        const requestQueueHandler = RequestQueueHandler.getInstance(mockHandler)

        it('return true if queue length greater than batch size', () => {
            requestQueueHandler['queue'] = { length: 99999 }
            expect(requestQueueHandler.shouldProceed()).toBe(true)
        })

        it('return false if queue length less than batch size', () => {
            requestQueueHandler['queue'] = { length: 0 }
            expect(requestQueueHandler.shouldProceed()).toBe(false)
        })
    })

    describe('shutdown', () => {
        const requestQueueHandler = RequestQueueHandler.getInstance(mockHandler)

        it('return true if queue length greater than batch size', () => {
            requestQueueHandler['queue'] = [{ event_type: 'LogCreated', logs: [{ kind: 'HTTP' }] }]
            requestQueueHandler.shutdown()
            expect(mockHandler).toBeCalled()
        })
    })

    describe('resetEventBatchPolling', () => {
        const requestQueueHandler = RequestQueueHandler.getInstance(mockHandler)
        const removeEventBatchPollingSpy = jest.spyOn(requestQueueHandler, 'removeEventBatchPolling')
        const startEventBatchPollingSpy = jest.spyOn(requestQueueHandler, 'startEventBatchPolling')

        beforeEach(() => {
            removeEventBatchPollingSpy.mockClear()
            startEventBatchPollingSpy.mockClear()
        })

        it('calls relevant methods', () => {
            requestQueueHandler.resetEventBatchPolling()
            expect(removeEventBatchPollingSpy).toBeCalled()
            expect(startEventBatchPollingSpy).toBeCalled()
        })
    })
})
