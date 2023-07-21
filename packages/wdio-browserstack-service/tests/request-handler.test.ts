import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { DATA_BATCH_ENDPOINT, DATA_SCREENSHOT_ENDPOINT } from '../src/constants.js'
import RequestQueueHandler from '../src/request-handler.js'
import * as utils from '../src/util.js'

const requestQueueHandler = RequestQueueHandler.getInstance()

describe('RequestQueueHandler', () => {
    const startEventBatchPollingSpy = vi.spyOn(requestQueueHandler, 'startEventBatchPolling').mockImplementation()
    const resetEventBatchPollingSpy = vi.spyOn(requestQueueHandler, 'resetEventBatchPolling').mockImplementation()
    const batchAndPostEventsSpy = vi.spyOn(utils, 'batchAndPostEvents').mockImplementation()

    beforeEach(() => {
    })

    afterEach(() => {
        startEventBatchPollingSpy.mockClear()
        resetEventBatchPollingSpy.mockClear()
    })

    describe('start', () => {
        it('update started if not started', () => {
            requestQueueHandler['started'] = false
            requestQueueHandler.start()
            expect(requestQueueHandler['started']).toBe(true)
        })
    })

    describe('add', () => {
        describe('return false if BS_TESTOPS_BUILD_COMPLETED not present', () => {
            it('proceed = false', () => {
                delete process.env.BS_TESTOPS_BUILD_COMPLETED
                const req = requestQueueHandler.add({ event_type: 'there' })
                expect(req).toEqual({ proceed: false })
            })
        })

        describe('return proceed = true', () => {
            beforeEach(() => {
                process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
            })

            it('if event_type not in BATCH_EVENT_TYPES', () => {
                const req = requestQueueHandler.add({ event_type: 'not there' })
                expect(req.proceed).toEqual(true)
            })

            it('if event_type is TEST_SCREENSHOT', () => {
                const req = requestQueueHandler.add({ event_type: 'LogCreated', logs: [{ kind: 'TEST_SCREENSHOT' }] })
                expect(req.proceed).toEqual(true)
                expect(req.url).toEqual(DATA_SCREENSHOT_ENDPOINT)
            })

            it('if event_type in BATCH_EVENT_TYPES', () => {
                const req = requestQueueHandler.add({ event_type: 'LogCreated', logs: [{ kind: 'HTTP' }] })
                expect(req.url).toEqual(DATA_BATCH_ENDPOINT)
            })
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

    describe('removeEventBatchPolling', () => {
        it('set started as false if pollEventBatchInterval present', () => {
            requestQueueHandler['pollEventBatchInterval'] = setInterval(() => {})
            requestQueueHandler.removeEventBatchPolling('Resetting')
            expect(requestQueueHandler['started']).toBe(false)
        })
    })

    describe('shutdown', () => {
        it('return true if queue length greater than batch size', () => {
            requestQueueHandler['queue'] = [{ event_type: 'LogCreated', logs: [{ kind: 'HTTP' }] }]
            requestQueueHandler.shutdown()
            expect(batchAndPostEventsSpy).toBeCalled()
        })
    })
})
