import TestReporter from '../src/reporter'
import { uploadEventData } from '../src/util'

import logger from '@wdio/logger'

const reporter = new TestReporter({})
const log = logger('test')

jest.mock('../src/util', () => {
    return {
        uploadEventData: jest.fn().mockReturnValue(undefined),
        getCloudProvider: jest.fn().mockReturnValue('browserstack'),
    }
})

describe('test-reporter', () => {
    beforeEach(() => {
        (log.debug as jest.Mock).mockClear()
    })

    describe('on create', () => {
        it('should verify initial properties', () => {
            expect(reporter['_capabilities']).toEqual({})
            expect(reporter['_observability']).toBe(true)
            expect(reporter['_sessionId']).toEqual(undefined)
            expect(reporter['_suiteName']).toEqual(undefined)
        })
    })

    describe('onSuiteStart', () => {
        beforeAll(() => {
            reporter.onSuiteStart({ file: 'filename' } as any)
        })

        it('should set _suiteName', () => {
            expect(reporter['_suiteName']).toEqual('filename')
        })
    })

    describe('onRunnerStart', () => {
        beforeAll(() => {
            reporter.onRunnerStart({
                type: 'runner',
                start: '2018-05-14T15:17:18.901Z',
                _duration: 0,
                cid: '0-0',
                capabilities: { browserName: 'chrome', version: '68' }, // session capabilities
                sanitizedCapabilities: 'chrome.66_0_3359_170.linux',
                config: { capabilities: { browserName: 'chrome' }, framework: 'mocha' }, // user capabilities
                specs: ['/tmp/user/spec.js']
            } as any)
        })

        it('should set properties', () => {
            expect(reporter['_capabilities']).toEqual({ browserName: 'chrome', version: '68' })
            expect(reporter['_observability']).toEqual(true)
        })

        it('should set properties - handle false', () => {
            let tmpReporter = new TestReporter({})
            tmpReporter.onRunnerStart({
                type: 'runner',
                start: '2018-05-14T15:17:18.901Z',
                _duration: 0,
                cid: '0-0',
                capabilities: { browserName: 'chrome', version: '68' }, // session capabilities
                sanitizedCapabilities: 'chrome.66_0_3359_170.linux',
                config: { capabilities: { browserName: 'chrome' }, testObservability: false }, // user capabilities
                specs: ['/tmp/user/spec.js']
            } as any)
            expect(tmpReporter['_capabilities']).toEqual({ browserName: 'chrome', version: '68' })
            expect(tmpReporter['_observability']).toEqual(false)
        })
    })

    describe('onTestSkip', () => {
        it('logger called', async () => {
            await reporter.onTestSkip({
                type: 'test',
                start: '2018-05-14T15:17:18.901Z',
                title: 'Given the title is "Google1"',
                fullTitle: undefined,
                state: 'skipped'
            } as any)
            expect(log.debug).toHaveBeenCalledTimes(1)
        })

        it('uploadEventData called', async () => {
            await reporter.onTestSkip({
                type: 'test',
                start: '2018-05-14T15:17:18.901Z',
                _duration: 0,
                uid: '23',
                cid: '0-0',
                title: 'Given the title is "Google1"',
                fullTitle: 'TestDesc.TestRun.it',
                output: [],
                argument: undefined,
                retries: 0,
                parent: '1',
                state: 'skipped'
            } as any)
            expect(uploadEventData).toBeCalledTimes(2)
            expect(log.debug).toHaveBeenCalledTimes(0)
        })
    })

})
