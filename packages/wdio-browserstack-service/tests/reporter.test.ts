import path from 'node:path'
import logger from '@wdio/logger'
import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from 'vitest'

import TestReporter from '../src/reporter.js'
import RequestQueueHandler from '../src/request-handler.js'
import * as utils from '../src/util.js'

const log = logger('test')

vi.useFakeTimers().setSystemTime(new Date('2020-01-01'))
vi.mock('uuid', () => ({ v4: () => '123456789' }))
vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('test-reporter', () => {
    beforeEach(() => {
        vi.mocked(log.debug).mockClear()
    })

    describe('on create', () => {
        const reporter = new TestReporter({})
        it('should verify initial properties', () => {
            expect(reporter['_capabilities']).toEqual({})
            expect(reporter['_observability']).toBe(true)
            expect(reporter['_sessionId']).toEqual(undefined)
            expect(reporter['_suiteName']).toEqual(undefined)
        })
    })

    describe('onSuiteStart', () => {
        const reporter = new TestReporter({})
        beforeAll(() => {
            reporter.onSuiteStart({ file: 'filename' } as any)
        })

        it('should set _suiteName', () => {
            expect(reporter['_suiteName']).toEqual('filename')
        })
    })

    describe('onRunnerStart', () => {
        const reporter = new TestReporter({})

        it('should set properties', () => {
            reporter.onRunnerStart({
                type: 'runner',
                start: '2018-05-14T15:17:18.901Z',
                _duration: 0,
                cid: '0-0',
                capabilities: { browserName: 'chrome', browserVersion: '68' }, // session capabilities
                sanitizedCapabilities: 'chrome.66_0_3359_170.linux',
                config: { capabilities: { browserName: 'chrome', browserVersion: '68' }, framework: 'mocha', hostname: 'browserstack.com' }, // user capabilities
                specs: ['/tmp/user/spec.js'],
                sessionId: 'sessionId'
            } as any)
            expect(reporter['_capabilities']).toEqual({ browserName: 'chrome', browserVersion: '68' })
            expect(reporter['_observability']).toEqual(true)
        })

        it('should set properties - handle false', () => {
            reporter.onRunnerStart({
                type: 'runner',
                start: '2018-05-14T15:17:18.901Z',
                _duration: 0,
                cid: '0-0',
                capabilities: { browserName: 'chrome', browserVersion: '68' }, // session capabilities
                sanitizedCapabilities: 'chrome.66_0_3359_170.linux',
                config: { testObservability: false, capabilities: { browserName: 'chrome', browserVersion: '68' }, framework: 'mocha', hostname: 'browserstack.com' }, // user capabilities
                specs: ['/tmp/user/spec.js'],
                sessionId: 'sessionId'
            } as any)
            expect(reporter['_capabilities']).toEqual({ browserName: 'chrome', browserVersion: '68' })
            expect(reporter['_observability']).toEqual(false)
        })
    })

    describe('onTestSkip', () => {
        const reporter = new TestReporter({})
        const requestQueueHandler = RequestQueueHandler.getInstance()
        const uploadEventDataSpy = vi.spyOn(utils, 'uploadEventData').mockImplementation(() => Promise.resolve())
        const getCloudProviderSpy = vi.spyOn(utils, 'getCloudProvider').mockReturnValue('browserstack')
        const scopesSpy = vi.spyOn(utils, 'getHierarchy').mockImplementation(() => [])
        vi.spyOn(requestQueueHandler, 'add').mockImplementation(() => { return { proceed: true, data: [{}], url: '' } })

        beforeEach(() => {
            uploadEventDataSpy.mockClear()
            getCloudProviderSpy.mockClear()
            scopesSpy.mockClear()

            reporter.onRunnerStart({
                type: 'runner',
                start: '2018-05-14T15:17:18.901Z',
                _duration: 0,
                cid: '0-0',
                capabilities: { browserName: 'chrome', browserVersion: '68' }, // session capabilities
                sanitizedCapabilities: 'chrome.66_0_3359_170.linux',
                config: { capabilities: { browserName: 'chrome', browserVersion: '68' }, framework: 'mocha', hostname: 'browserstack.com' }, // user capabilities
                specs: ['/tmp/user/spec.js'],
                sessionId: 'sessionId'
            } as any)
        })

        it('uploadEventData called', async () => {
            reporter['_observability'] = true
            reporter['_config'] = { capabilities: { browserName: 'chrome', browserVersion: '68' }, framework: 'mocha', hostname: 'browserstack.com' }
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
