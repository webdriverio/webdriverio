/// <reference path='../../webdriverio/src/@types/async.d.ts' />
import logger from '@wdio/logger'

import * as PercyHelper from '../src/Percy/PercyHelper'
import Percy from '../src/Percy/Percy'
import * as PercyLogger from '../src/Percy/PercyLogger'

import { Browser, MultiRemoteBrowser } from 'webdriverio'

const log = logger('test')
let browser: Browser<'async'> | MultiRemoteBrowser<'async'>

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
})

describe('startPercy', () => {
    let percyStartSpy: any

    beforeEach(() => {
        percyStartSpy = jest.spyOn(Percy.prototype, 'start').mockImplementationOnce(async () => {
            return true
        })
    })

    it('should call start method of Percy', async () => {
        await PercyHelper.startPercy({}, {}, {})
        expect(percyStartSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        percyStartSpy.mockClear()
    })
})

describe('stopPercy', () => {
    let percyStopSpy: any

    beforeEach(() => {
        percyStopSpy = jest.spyOn(Percy.prototype, 'stop').mockImplementationOnce(async () => {
            return {}
        })
    })

    it('should call stop method of Percy', async () => {
        const percy = new Percy({}, {}, {})
        await PercyHelper.stopPercy(percy)
        expect(percyStopSpy).toBeCalledTimes(1)
    })

    afterEach(() => {
        percyStopSpy.mockClear()
    })
})

describe('getBestPlatformForPercySnapshot', () => {
    const capsArr: any = [
        {
            maxInstances: 5,
            browserName: 'edge',
            browserVersion: 'latest',
            platformName: 'Windows 10',
            'goog:chromeOptions': {},
            'bstack:options': {
                'projectName': 'Project Name',
                'browserName': 'edge'
            }
        },
        {
            maxInstances: 5,
            browserName: 'chrome',
            browserVersion: 'latest',
            platformName: 'Windows 10',
            'goog:chromeOptions': {},
            'bstack:options': {
                'projectName': 'Project Name',
                'browserName': 'chrome'
            }
        },
        {
            maxInstances: 5,
            browserName: 'firefox',
            browserVersion: 'latest',
            platformName: 'Windows 10',
            'moz:firefoxOptions': {},
            'bstack:options': {
                'projectName': 'Project Name',
                'browserName': 'firefox'
            }
        }
    ]

    const capsObj: any = {
        'key-1': {
            capabilities: {
                maxInstances: 5,
                browserName: 'edge',
                browserVersion: 'latest',
                platformName: 'Windows 10',
                'goog:chromeOptions': {},
                'bstack:options': {
                    'projectName': 'Project Name',
                    'browserName': 'edge'
                }
            }
        },
        'key-2': {
            capabilities: {
                maxInstances: 5,
                browserName: 'chrome',
                browserVersion: 'latest',
                platformName: 'Windows 10',
                'goog:chromeOptions': {},
                'bstack:options': {
                    'projectName': 'Project Name',
                    'browserName': 'chrome'
                }
            }
        },
        'key-3': {
            capabilities: {
                maxInstances: 5,
                browserName: 'firefox',
                browserVersion: 'latest',
                platformName: 'Windows 10',
                'moz:firefoxOptions': {},
                'bstack:options': {
                    'projectName': 'Project Name',
                    'browserName': 'firefox'
                }
            }
        },
    }

    it('should return correct caps for best platform - Array', () => {
        const bestPlatformCaps = PercyHelper.getBestPlatformForPercySnapshot(capsArr)
        expect(bestPlatformCaps).toEqual({
            maxInstances: 5,
            browserName: 'chrome',
            browserVersion: 'latest',
            platformName: 'Windows 10',
            'goog:chromeOptions': {},
            'bstack:options': {
                'projectName': 'Project Name',
                'browserName': 'chrome'
            }
        })
    })

    it('should return correct caps for best platform - Object', () => {
        const bestPlatformCaps = PercyHelper.getBestPlatformForPercySnapshot(capsObj)
        expect(bestPlatformCaps).toEqual({
            maxInstances: 5,
            browserName: 'chrome',
            browserVersion: 'latest',
            platformName: 'Windows 10',
            'goog:chromeOptions': {},
            'bstack:options': {
                'projectName': 'Project Name',
                'browserName': 'chrome'
            }
        })
    })
})
