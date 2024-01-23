/// <reference path="../../webdriverio/src/@types/async.d.ts" />

import logger from '@wdio/logger'

import PercyHandler from '../src/Percy/Percy-Handler'
import PercyCaptureMap from '../src/Percy/PercyCaptureMap'
import * as PercySDK from '../src/Percy/PercySDK'
import type { Capabilities } from '@wdio/types'
import { Browser, MultiRemoteBrowser } from 'webdriverio'
import * as PercyLogger from '../src/Percy/PercyLogger'

import type { BeforeCommandArgs, AfterCommandArgs } from '@wdio/reporter'

const log = logger('test')
let percyHandler: PercyHandler
let browser: Browser<'async'> | MultiRemoteBrowser<'async'>
let caps: Capabilities.RemoteCapability

// jest.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
jest.useFakeTimers().setSystemTime(new Date('2020-01-01'))
jest.mock('uuid', () => ({ v4: () => '123456789' }))

const PercyLoggerSpy = jest.spyOn(PercyLogger.PercyLogger, 'logToFile')
PercyLoggerSpy.mockImplementation(() => {})

beforeEach(() => {
    jest.mocked(log.info).mockClear()

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
        getInstance: jest.fn().mockImplementation((browserName: string) => browser[browserName]),
        browserB: {},
        execute: jest.fn(),
        executeAsync: async () => { 'done' },
        getUrl: () => { return 'https://www.google.com/'},
        on: jest.fn(),
    } as any as Browser<'async'> | MultiRemoteBrowser<'async'>
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
    percyHandler['_percyAutoCaptureMode'] = 'auto'
    expect(percyHandler['_percyAutoCaptureMode']).toEqual('auto')

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

describe('sleep', () => {
    beforeEach(() => {
        percyHandler = new PercyHandler('manual', browser, caps, false, 'framework')
    })
    it('sets sleep', async () => {
        percyHandler.sleep(234)
    })
})

describe('cleanupDeferredScreenshots', () => {
    beforeEach(() => {
        percyHandler = new PercyHandler('manual', browser, caps, false, 'framework')
    })
    it('calls cleanupDeferredScreenshots', async () => {
        percyHandler['_percyDeferredScreenshots'] = []
        percyHandler.cleanupDeferredScreenshots()
        expect(percyHandler['_percyDeferredScreenshots']).toEqual([])
        expect(percyHandler['_isPercyCleanupProcessingUnderway']).toEqual(true)
    })
})

describe('isDOMChangingCommand', () => {
    beforeEach(() => {
        percyHandler = new PercyHandler('manual', browser, caps, false, 'framework')
    })
    it('should call isDOMChangingCommand', async () => {
        const args = {
            endpoint: 'actions',
            body: {
                actions: [{
                    type: 'key'
                }]
            }
        }
        // await percyHandler.browserAfterCommand(args as BeforeCommandArgs & AfterCommandArgs)
        let res = percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        expect(res).toEqual(false)
    })
    it('should call isDOMChangingCommand with method: DELETE', async () => {
        const args = {
            method: 'DELETE',
            endpoint: '/session/:sessionId',
            body: {
                actions: [{
                    type: 'key'
                }]
            }
        }
        // await percyHandler.browserAfterCommand(args as BeforeCommandArgs & AfterCommandArgs)
        let res = percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        expect(res).toEqual(true)
    })
    it('should call isDOMChangingCommand with method: POST', async () => {
        const args = {
            method: 'POST',
            endpoint: '/session/:sessionId/url',
            body: {
                actions: [{
                    type: 'key'
                }]
            }
        }
        // await percyHandler.browserAfterCommand(args as BeforeCommandArgs & AfterCommandArgs)
        percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        let res = percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        expect(res).toEqual(true)
    })
    it('should call isDOMChangingCommand with method: POST and click', async () => {
        const args = {
            method: 'POST',
            endpoint: '/session/:sessionId/element/click',
            body: {
                actions: [{
                    type: 'key'
                }]
            }
        }
        // await percyHandler.browserAfterCommand(args as BeforeCommandArgs & AfterCommandArgs)
        percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        let res = percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        expect(res).toEqual(true)
    })
    it('should call isDOMChangingCommand with method: POST and clear', async () => {
        const args = {
            method: 'POST',
            endpoint: '/session/:sessionId/element/clear',
            body: {
                actions: [{
                    type: 'key'
                }]
            }
        }
        percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        let res = percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        expect(res).toEqual(true)
    })
    it('should call isDOMChangingCommand with method: POST and command touch', async () => {
        const args = {
            method: 'POST',
            endpoint: '/session/:sessionId/touch',
            body: {
                actions: [{
                    type: 'key'
                }]
            }
        }
        percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        let res = percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        expect(res).toEqual(true)
    })
    it('should call isDOMChangingCommand with method: POST and command execute', async () => {
        const args = {
            method: 'POST',
            endpoint: '/session/:sessionId/execute',
            body: {
                script: 'script',
                actions: [{
                    type: 'key'
                }]
            }
        }
        percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        let res = percyHandler.isDOMChangingCommand(args as BeforeCommandArgs)
        expect(res).toEqual(true)
    })
})

describe('teardown', () => {
    beforeEach(() => {
        percyHandler = new PercyHandler('manual', browser, caps, false, 'framework')
    })
    it('resolves promise if _percyScreenshotCounter is 0', async () => {
        percyHandler.teardown().then(() => {
            expect(percyHandler['_percyScreenshotCounter']).toEqual(0)
        }).catch(() => {
            expect(percyHandler['_percyScreenshotCounter']).not.equal(0)
        })
    })
})

describe('browserBeforeCommand', () => {
    let percyHandler: PercyHandler

    beforeEach(() => {
        percyHandler = new PercyHandler('auto', browser, caps, false, 'framework')
    })

    it('should call browserBeforeCommand', async () => {
        const args = {
            endpoint: 'actions',
            body: {
                actions: [{
                    type: 'key'
                }]
            }
        }
        await percyHandler.browserBeforeCommand(args as BeforeCommandArgs & AfterCommandArgs)
    })

    afterEach(() => {
    })
})

describe('browserCommand', () => {
    let percyAutoCaptureSpy: any
    let percyHandler: PercyHandler

    beforeEach(() => {
        percyHandler = new PercyHandler('auto', browser, caps, false, 'framework')
        percyHandler.before()
        percyAutoCaptureSpy = jest.spyOn(PercyHandler.prototype, 'deferCapture')
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

    it('should call percyAutoCapture for event type element and capture mode auto', async () => {
        const args = {
            endpoint: '/session/:sessionId/element/value'
        }
        percyHandler['_percyAutoCaptureMode'] = 'auto'

        await percyHandler.browserAfterCommand(args as BeforeCommandArgs & AfterCommandArgs)
        expect(percyAutoCaptureSpy).toBeCalledTimes(1)
    })

    it('should call percyAutoCapture for event type element and capture mode auto', async () => {
        const args = {}
        percyHandler['_percyAutoCaptureMode'] = 'auto'

        await percyHandler.browserAfterCommand(args as BeforeCommandArgs & AfterCommandArgs)
        expect(percyAutoCaptureSpy).toBeCalledTimes(0)
    })

    afterEach(() => {
        percyAutoCaptureSpy.mockClear()
    })
})

describe('afterScenario', () => {
    let percyAutoCaptureSpy: any
    let percyHandler: PercyHandler

    beforeEach(() => {
        percyHandler = new PercyHandler('manual', browser, caps, false, 'framework')
        percyHandler.before()
        percyAutoCaptureSpy = jest.spyOn(PercyHandler.prototype, 'percyAutoCapture')
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
        percyAutoCaptureSpy = jest.spyOn(PercyHandler.prototype, 'percyAutoCapture')
    })

    it('should call percyAutoCapture', async () => {
        percyHandler['_percyAutoCaptureMode'] = 'testcase'
        await percyHandler.afterTest()
        expect(percyAutoCaptureSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        percyAutoCaptureSpy.mockClear()
        jest.clearAllMocks()
    })
})

describe('percyAutoCapture', () => {
    let percyScreenshotSpy: any
    let percyScreenshotAppSpy: any

    beforeEach(() => {
        percyHandler = new PercyHandler('auto', browser, caps, false, 'framework')
        percyHandler._setSessionName('1234')
        percyHandler.before()

        percyScreenshotSpy = jest.spyOn(PercySDK, 'screenshot').mockImplementation(() => Promise.resolve())
        percyScreenshotAppSpy = jest.spyOn(PercySDK, 'screenshotApp').mockImplementation(() => Promise.resolve())
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

describe('percyCaptureMap', () => {
    let percyAutoCaptureMapGetNameSpy: any
    let percyAutoCaptureMapIncrementSpy: any
    let percyHandler: PercyHandler

    beforeEach(() => {
        percyHandler = new PercyHandler('auto', browser, caps, false, 'framework')
        percyHandler.before()
        percyAutoCaptureMapGetNameSpy = jest.spyOn(PercyCaptureMap.prototype, 'getName')
        percyAutoCaptureMapIncrementSpy = jest.spyOn(PercyCaptureMap.prototype, 'increment')
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
