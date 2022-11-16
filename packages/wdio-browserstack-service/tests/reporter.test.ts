import TestReporter from '../src/reporter'
import logger from '@wdio/logger'
import * as utils from '../src/util'

const reporter = new TestReporter({})
const log = logger('test')

jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
jest.mock('uuid', () => ({ v4: () => '123456789' }))

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
                capabilities: { browserName: 'chrome', browserVersion: '68' }, // session capabilities
                sanitizedCapabilities: 'chrome.66_0_3359_170.linux',
                config: { capabilities: { browserName: 'chrome' }, framework: 'mocha', hostname: 'browserstack.com' }, // user capabilities
                specs: ['/tmp/user/spec.js']
            } as any)
        })

        it('should set properties', () => {
            expect(reporter['_capabilities']).toEqual({ browserName: 'chrome', browserVersion: '68' })
            expect(reporter['_observability']).toEqual(true)
        })

        it('should set properties - handle false', () => {
            let tmpReporter = new TestReporter({})
            tmpReporter.onRunnerStart({
                type: 'runner',
                start: '2018-05-14T15:17:18.901Z',
                _duration: 0,
                cid: '0-0',
                capabilities: { browserName: 'chrome', browserVersion: '68' }, // session capabilities
                sanitizedCapabilities: 'chrome.66_0_3359_170.linux',
                config: { capabilities: { browserName: 'chrome' }, testObservability: false, framework: 'mocha', hostname: 'browserstack.com' }, // user capabilities
                specs: ['/tmp/user/spec.js']
            } as any)
            expect(tmpReporter['_capabilities']).toEqual({ browserName: 'chrome', browserVersion: '68' })
            expect(tmpReporter['_observability']).toEqual(false)
        })
    })

    describe('onTestSkip', () => {
        const uploadEventDataSpy = jest.spyOn(utils, 'uploadEventData').mockImplementation()
        const getCloudProviderSpy = jest.spyOn(utils, 'getCloudProvider').mockReturnValue('browserstack')
        const scopesSpy = jest.spyOn(utils, 'getHierarchy').mockImplementation(() => [])

        beforeEach(() => {
            uploadEventDataSpy.mockClear()
            getCloudProviderSpy.mockClear()
            scopesSpy.mockClear()
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
            expect(uploadEventDataSpy).toBeCalledTimes(1)
            expect(scopesSpy).toBeCalledTimes(1)
            expect(log.debug).toHaveBeenCalledTimes(0)
        })

        it('uploadEventData not called for cucumber', async () => {
            reporter['_config'] = { framework: 'cucumber' } as any
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
            expect(uploadEventDataSpy).toBeCalledTimes(0)
            expect(scopesSpy).toBeCalledTimes(0)
            expect(log.debug).toHaveBeenCalledTimes(0)
        })

        afterEach(() => {
            uploadEventDataSpy.mockClear()
            getCloudProviderSpy.mockClear()
        })
    })

})
