import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import RequestQueueHandler from '../src/request-handler.js'
import * as bstackLogger from '../src/bstackLogger.js'
import { TESTOPS_BUILD_COMPLETED_ENV } from '../src/constants.js'

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('RequestQueueHandler', () => {
    let requestQueueHandler: RequestQueueHandler
    const mockHandler = vi.fn()
    let startEventBatchPollingSpy: any
    let resetEventBatchPollingSpy: any

    beforeEach(() => {
        vi.resetAllMocks()
        requestQueueHandler = RequestQueueHandler.getInstance(mockHandler)
        startEventBatchPollingSpy = vi.spyOn(requestQueueHandler, 'startEventBatchPolling').mockImplementation(() => {})
        resetEventBatchPollingSpy = vi.spyOn(requestQueueHandler, 'resetEventBatchPolling').mockImplementation(() => {})
    })
    afterEach(() => {
        startEventBatchPollingSpy.mockClear()
        resetEventBatchPollingSpy.mockClear()
        vi.resetAllMocks()
    })

    describe('add', () => {
        it('throw error if BS_TESTOPS_BUILD_COMPLETED not present', () => {
            delete process.env[TESTOPS_BUILD_COMPLETED_ENV]
            expect(() => requestQueueHandler.add({ event_type: 'there' })).toThrowError(/Observability build start not completed yet/)
        })

        it('if event_type in BATCH_EVENT_TYPES', () => {
            process.env[TESTOPS_BUILD_COMPLETED_ENV] = 'true'
            expect(() => requestQueueHandler.add({ event_type: 'LogCreated', logs: [{ kind: 'HTTP' }] })).not.toThrowError()
        })
    })

    describe('shouldProceed', () => {
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
        it('return true if queue length greater than batch size', () => {
            requestQueueHandler['queue'] = [{ event_type: 'LogCreated', logs: [{ kind: 'HTTP' }] }]
            requestQueueHandler.shutdown()
            expect(mockHandler).toHaveBeenCalledOnce()
        })
    })
})
