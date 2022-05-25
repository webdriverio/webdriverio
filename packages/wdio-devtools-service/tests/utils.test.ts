import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'
import type { Browser } from 'webdriverio'

import {
    sumByKey, isBrowserVersionLower, getBrowserMajorVersion,
    isBrowserSupported, setUnsupportedCommand, getLighthouseDriver
} from '../src/utils'
import { RequestPayload } from '../src/handler/network'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('fs', () => ({
    readFileSync: vi.fn().mockReturnValue('1234\nsomepath'),
    existsSync: vi.fn()
}))

vi.mock('lighthouse/lighthouse-core/gather/connections/cri.js', () => ({
    default: class ChromeProtocol {
        public _runJsonCommand = vi.fn().mockReturnValue(['foobar'])
        public _connectToSocket = vi.fn()
        public _sendCommandMock = vi.fn()
        public on = vi.fn()

        sendCommand (...args: any) {
            this._sendCommandMock(...args)
            return { sessionId: 'session 321' }
        }
    }
}))

test('sumByKey', () => {
    expect(sumByKey([{
        size: 1
    } as unknown as RequestPayload, {
        size: 2
    } as unknown as RequestPayload, {
        size: 3
    } as unknown as RequestPayload], 'size')).toBe(6)
})

test('setUnsupportedCommand', () => {
    const browser = { addCommand: vi.fn() }
    setUnsupportedCommand(browser as unknown as Browser<'async'>)
    expect(browser.addCommand).toHaveBeenCalledWith('cdp', expect.any(Function))
    const fn = browser.addCommand.mock.calls[0][1]
    expect(fn).toThrow()
})

describe('isBrowserVersionLower', () => {
    test('should return false if version capability is missing', () => {
        expect(isBrowserVersionLower({} as any, 11)).toBe(false)
    })

    test('should return true if version is lower than required', () => {
        // @ts-expect-error invalid param
        expect(isBrowserVersionLower({ version: 62 }, 63)).toBe(true)
    })

    test('should return false if version is higher than required', () => {
        const versionProps = ['browserVersion', 'browser_version', 'version']
        let browserVersion = 63
        versionProps.forEach(prop => {
            const caps = {} as any
            caps[prop] = browserVersion
            expect(isBrowserVersionLower(caps, 63)).toBe(false)
            browserVersion++
        })
    })
})

describe('getChromeMajorVersion', () => {
    test('should return whatever value is passed if not a string', () => {
        expect(getBrowserMajorVersion({} as any)).toEqual({})
        expect(getBrowserMajorVersion(true as any)).toEqual(true)
        expect(getBrowserMajorVersion(78)).toEqual(78)
    })

    test('should return major version if proper version is passed', () => {
        expect(getBrowserMajorVersion('78.0.3904.11')).toEqual(78)
        expect(getBrowserMajorVersion('100.0')).toEqual(100)
        expect(getBrowserMajorVersion('78')).toEqual(78)
    })
})

describe('isBrowserSupported', () => {
    test('should return true when the browser and version are supported', () => {
        const caps = { browserName: 'Chromium', version: 80 }
        expect(isBrowserSupported(caps)).toEqual(true)
    })

    test('should return true when the browser and version are supported', () => {
        const caps = { browserName: 'Google Chrome', version: 80 }
        expect(isBrowserSupported(caps)).toEqual(true)
    })

    test('should return true when the browser and version are supported', () => {
        const caps = { browserName: 'Firefox', version: 86 }
        expect(isBrowserSupported(caps)).toEqual(true)
    })

    test('should return false when the version is not supported', () => {
        const capsFirefox = { browserName: 'firefox', version: 80 }
        expect(isBrowserSupported(capsFirefox)).toEqual(false)
    })

    test('should return false when the version is not supported', () => {
        const capsChrome = { browserName: 'chrome', version: 50 }
        expect(isBrowserSupported(capsChrome)).toEqual(false)
    })

    test('should return true when the browserName is not specified', () => {
        const capsEmpty = { version: 83 }
        // @ts-expect-error invalid param
        expect(isBrowserSupported(capsEmpty)).toEqual(false)
    })
    test('should return true when the version number is not specified', () => {
        const capsEmpty = { browserName: 'chrome' }
        expect(isBrowserSupported(capsEmpty)).toEqual(true)
    })

    test('should return true when the version number is not specified', () => {
        const capsEmpty = { browserName: 'firefox' }
        expect(isBrowserSupported(capsEmpty)).toEqual(true)
    })
})

describe('getLighthouseDriver', () => {
    test('should return a driver w/o creating new session', async () => {
        const urlMock = vi.fn().mockReturnValue('ws://127.0.0.1:56513/devtools/browser/9aae0e34-86a9-4b0e-856b-d0d37009ddbb')
        const session = {
            connection: vi.fn().mockReturnValue({ url: urlMock })
        }
        const target = { _targetId: 'foobar321' }
        const driver = await getLighthouseDriver(session as any, target as any)
        expect(session.connection).toBeCalledTimes(1)
        expect(urlMock).toBeCalledTimes(1)
        expect(driver.constructor.name).toBe('Driver')
    })

    test('should create a new session', async () => {
        const urlMock = vi.fn().mockReturnValue('ws://127.0.0.1:56513/session/9aae0e34-86a9-4b0e-856b-d0d37009ddbb/se/cdp')
        const session = {
            connection: vi.fn().mockReturnValue({ url: urlMock })
        }
        const target = { _targetId: 'foobar321' }
        const driver = await getLighthouseDriver(session as any, target as any)
        // @ts-expect-error
        driver._connection.sendCommand('foobar')
        // @ts-expect-error
        expect(driver._connection._sendCommandMock.mock.calls).toMatchSnapshot()
    })
})
