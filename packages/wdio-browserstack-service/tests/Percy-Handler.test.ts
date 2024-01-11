/// <reference path="../../webdriverio/src/@types/async.d.ts" />
/// <reference path="../src/@types/bstack-service-types.d.ts" />
import path from 'node:path'

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import got from 'got'
import logger from '@wdio/logger'

import PercyHandler from '../src/Percy/Percy-Handler.js'
import PercyCaptureMap from '../src/Percy/PercyCaptureMap.js'
import * as PercySDK from '../src/Percy/PercySDK.js'
import type { Capabilities } from '@wdio/types'
import * as PercyLogger from '../src/Percy/PercyLogger.js'

import type { BeforeCommandArgs, AfterCommandArgs } from '@wdio/reporter'

const log = logger('test')
let percyHandler: PercyHandler
let browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
let caps: Capabilities.RemoteCapability

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.useFakeTimers().setSystemTime(new Date('2020-01-01'))
vi.mock('uuid', () => ({ v4: () => '123456789' }))

const PercyLoggerSpy = vi.spyOn(PercyLogger.PercyLogger, 'logToFile')
PercyLoggerSpy.mockImplementation(() => {})

beforeEach(() => {
    vi.mocked(log.info).mockClear()
    vi.mocked(got).mockClear()
    vi.mocked(got.put).mockClear()
    vi.mocked(got).mockResolvedValue({
        body: {
            automation_session: {
                browser_url: 'https://www.browserstack.com/automate/builds/1/sessions/2'
            }
        }
    })
    vi.mocked(got.put).mockResolvedValue({})

    browser = {
        sessionId: 'session123',
        config: {},
        capabilities: {
            device: '',
            os: 'OS X',
            os_version: 'Catalina',
            browserName: 'chrome'
        },
        instances: ['browserA', 'browserB'],
        isMultiremote: false,
        browserA: {
            sessionId: 'session456',
            capabilities: { 'bstack:options': {
                device: '',
                os: 'Windows',
                osVersion: 10,
                browserName: 'chrome'
            } }
        },
        getInstance: vi.fn().mockImplementation((browserName: string) => browser[browserName]),
        browserB: {},
        execute: vi.fn(),
        executeAsync: async () => { 'done' },
        getUrl: () => { return 'https://www.google.com/'},
        on: vi.fn(),
    } as any as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    caps = {
        browserName: 'chrome',
        'bstack:options': {
            os: 'OS X',
            osVersion: 'Catalina',
            accessibility: true
        } } as Capabilities.RemoteCapability
    percyHandler = new PercyHandler('manual', browser, caps, false, 'framework')
})

it('should initialize correctly', () => {
    percyHandler = new PercyHandler('manual', browser, caps, false, 'framework')
    expect(percyHandler['_isAppAutomate']).toEqual(false)
    expect(percyHandler['_capabilities']).toEqual(caps)
    expect(percyHandler['_framework']).toEqual('framework')
    expect(percyHandler['_percyScreenshotCounter']).toEqual(0)
})

describe('_setSessionName', () => {
    beforeEach(() => {
        percyHandler = new PercyHandler('manual', browser, caps, false, 'framework')
    })
    it('sets sessionName property', async () => {
        percyHandler._setSessionName('1234')
        expect(percyHandler['_sessionName']).toEqual('1234')
    })
})

describe('teardown', () => {
    beforeEach(() => {
        percyHandler = new PercyHandler('manual', browser, caps, false, 'framework')
    })
    it('resolves promise if _percyScreenshotCounter is 0', async () => {
        percyHandler.teardown().then(() => {
            expect(percyHandler['_percyScreenshotCounter']).toEqual(0)
        /* eslint-disable @typescript-eslint/no-unused-vars */
        }).catch((err: any) => {
            expect(percyHandler['_percyScreenshotCounter']).not.equal(0)
        })
    })
})

describe('afterScenario', () => {
    let percyAutoCaptureSpy: any
    let percyHandler: PercyHandler

    beforeEach(() => {
        percyHandler = new PercyHandler('manual', browser, caps, false, 'framework')
        percyHandler.before()
        percyAutoCaptureSpy = vi.spyOn(PercyHandler.prototype, 'percyAutoCapture')
    })

    it('should not call percyAutoCapture', async () => {
        await percyHandler.afterScenario()
        expect(percyAutoCaptureSpy).not.toBeCalled()
    })

    it('should call percyAutoCapture', async () => {
        percyHandler['_percyAutoCaptureMode'] = 'testcase'
        await percyHandler.afterScenario()
        expect(percyAutoCaptureSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        percyAutoCaptureSpy.mockClear()
    })
})

describe('afterTest', () => {
    let percyAutoCaptureSpy: any
    let percyHandler: PercyHandler

    beforeEach(() => {
        percyHandler = new PercyHandler('manual', browser, caps, false, 'framework')
        percyHandler.before()
        percyAutoCaptureSpy = vi.spyOn(PercyHandler.prototype, 'percyAutoCapture')
    })

    it('should not call percyAutoCapture', async () => {
        await percyHandler.afterTest()
        expect(percyAutoCaptureSpy).not.toBeCalled()
    })

    it('should call percyAutoCapture', async () => {
        percyHandler['_percyAutoCaptureMode'] = 'testcase'
        await percyHandler.afterTest()
        expect(percyAutoCaptureSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        percyAutoCaptureSpy.mockClear()
    })
})

describe('percyAutoCapture', () => {
    let percyScreenshotSpy: any
    let percyScreenshotAppSpy: any

    beforeEach(() => {
        percyHandler = new PercyHandler('auto', browser, caps, false, 'framework')
        percyHandler._setSessionName('1234')
        percyHandler.before()

        percyScreenshotSpy = vi.spyOn(PercySDK, 'screenshot').mockImplementation(() => Promise.resolve())
        percyScreenshotAppSpy = vi.spyOn(PercySDK, 'screenshotApp').mockImplementation(() => Promise.resolve())
    })

    it('does not call Percy Selenium Screenshot', async () => {
        await percyHandler.percyAutoCapture(null)
        expect(percyScreenshotSpy).not.toBeCalled()
    })

    it('calls Percy Selenium Screenshot', async () => {
        await percyHandler.percyAutoCapture('keys')
        expect(percyScreenshotSpy).toBeCalledTimes(1)
    })

    it('calls Percy Appium Screenshot', async () => {
        percyHandler = new PercyHandler('auto', browser, caps, true, 'framework')
        await percyHandler.percyAutoCapture('keys')
        expect(percyScreenshotAppSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        percyScreenshotSpy.mockClear()
        percyScreenshotAppSpy.mockClear()
    })
})

describe('browserCommand', () => {
    let percyAutoCaptureSpy: any
    let percyHandler: PercyHandler

    beforeEach(() => {
        percyHandler = new PercyHandler('auto', browser, caps, false, 'framework')
        percyHandler.before()
        percyAutoCaptureSpy = vi.spyOn(PercyHandler.prototype, 'deferCapture')
    })

    it('should not call percyAutoCapture if no browser endpoint', async () => {
        const args = {}
        await percyHandler.browserAfterCommand(args as BeforeCommandArgs & AfterCommandArgs)
        expect(percyAutoCaptureSpy).not.toBeCalled()
    })

    it('should call percyAutoCapture for event type keys', async () => {
        const args = {
            endpoint: 'actions',
            body: {
                actions: [{
                    type: 'key'
                }]
            }
        }
        await percyHandler.browserAfterCommand(args as BeforeCommandArgs & AfterCommandArgs)
        expect(percyAutoCaptureSpy).toBeCalledTimes(1)
    })

    it('should call percyAutoCapture for event type click', async () => {
        const args = {
            endpoint: 'click'
        }
        await percyHandler.browserAfterCommand(args as BeforeCommandArgs & AfterCommandArgs)
        expect(percyAutoCaptureSpy).toBeCalledTimes(1)
    })

    it('should call percyAutoCapture for event type screenshot', async () => {
        const args = {
            endpoint: 'screenshot'
        }
        await percyHandler.browserAfterCommand(args as BeforeCommandArgs & AfterCommandArgs)
        expect(percyAutoCaptureSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        percyAutoCaptureSpy.mockClear()
    })
})

describe('percyCaptureMap', () => {
    let percyAutoCaptureMapGetNameSpy: any
    let percyAutoCaptureMapIncrementSpy: any
    let percyHandler: PercyHandler

    beforeEach(() => {
        percyHandler = new PercyHandler('auto', browser, caps, false, 'framework')
        percyHandler.before()
        percyAutoCaptureMapGetNameSpy = vi.spyOn(PercyCaptureMap.prototype, 'getName')
        percyAutoCaptureMapIncrementSpy = vi.spyOn(PercyCaptureMap.prototype, 'increment')
    })

    it('should call getName method of PercyCaptureMap', async () => {
        await percyHandler.percyAutoCapture('keys')
        await percyHandler.percyAutoCapture('keys')
        expect(percyAutoCaptureMapGetNameSpy).toBeCalledTimes(2)
    })

    it('should call getName method of PercyCaptureMap', async () => {
        await percyHandler.percyAutoCapture('click')
        await percyHandler.percyAutoCapture('click')
        expect(percyAutoCaptureMapIncrementSpy).toBeCalledTimes(2)
    })

    afterEach(() => {
        percyAutoCaptureMapGetNameSpy.mockClear()
        percyAutoCaptureMapIncrementSpy.mockClear()
    })
})
