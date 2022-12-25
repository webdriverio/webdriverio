import { DATA_BATCH_ENDPOINT, DATA_SCREENSHOT_ENDPOINT } from '../src/constants'
import RequestQueueHandler from '../src/request-handler'
import * as utils from '../src/util'

jest.useFakeTimers()

describe('RequestQueueHandler', () => {

    describe('start', () => {
        const requestQueueHandler = RequestQueueHandler.getInstance()

        it('update started if not started', () => {
            requestQueueHandler['started'] = false
            requestQueueHandler.start()
            expect(requestQueueHandler['started']).toBe(true)
        })
    })

    describe('add', () => {
        const requestQueueHandler = RequestQueueHandler.getInstance()

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

        describe('shouldProceed returns true', () => {
            jest.spyOn(requestQueueHandler, 'shouldProceed').mockReturnValueOnce(true)
            beforeEach(() => {
                process.env.BS_TESTOPS_BUILD_COMPLETED = 'true'
            })
            it('if event_type in BATCH_EVENT_TYPES', () => {
                const req = requestQueueHandler.add({ event_type: 'LogCreated', logs: [{ kind: 'HTTP' }] })
                expect(req.url).toEqual(DATA_BATCH_ENDPOINT)
            })
        })
    })

    describe('shouldProceed', () => {
        const requestQueueHandler = RequestQueueHandler.getInstance()

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
        const requestQueueHandler = RequestQueueHandler.getInstance()
        const batchAndPostEventsSpy = jest.spyOn(utils, 'batchAndPostEvents').mockImplementation()

        beforeEach(() => {
            batchAndPostEventsSpy.mockClear()
        })

        it('return true if queue length greater than batch size', () => {
            requestQueueHandler['queue'] = [{ event_type: 'LogCreated', logs: [{ kind: 'HTTP' }] }]
            requestQueueHandler.shutdown()
            expect(batchAndPostEventsSpy).toBeCalled()
        })
    })
    describe('resetEventBatchPolling', () => {
        const requestQueueHandler = RequestQueueHandler.getInstance()
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
