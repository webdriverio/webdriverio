import { format } from 'util'
import { findCDPInterface, getCDPClient, sumByKey, readIOStream, isBrowserVersionLower, getChromeMajorVersion } from '../src/utils'

import CDP from 'chrome-remote-interface'

const COMMAND_LINE_TEXT = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --disable-background-networking --disable-client-side-phishing-detection --disable-default-apps --disable-hang-monitor --disable-popup-blocking --disable-prompt-on-repost --disable-sync --disable-web-resources --enable-automation --enable-logging --force-fieldtrials=SiteIsolationExtensions/Control --ignore-certificate-errors --load-extension=/var/folders/ns/8mj2mh0x27b_gsdddy1knnsm0000gn/T/.org.chromium.Chromium.qTYMcL/internal --log-level=0 --metrics-recording-only --no-first-run --password-store=basic --remote-debugging-port=%d --test-type=webdriver --use-mock-keychain --user-data-dir=/var/folders/ns/8mj2mh0x27b_gsdddy1knnsm0000gn/T/.org.chromium.Chromium.M5ibvC --flag-switches-begin --flag-switches-end data:,'

jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue('1234\nsomepath'),
    existsSync: jest.fn()
}))

test('getCDPClient', async () => {
    const cdp = await getCDPClient({ host: 'localhost', port: 1234 })
    expect(CDP.mock.calls).toHaveLength(1)
    expect(CDP.mock.calls[0][0].port).toBe(1234)
    expect(CDP.mock.calls[0][0].host).toBe('localhost')
    expect(typeof cdp.on).toBe('function')
})

test('findCDPInterface', async () => {
    const cmdLineText = format(COMMAND_LINE_TEXT, 1234)
    const elemMock = { getText: jest.fn().mockReturnValue(Promise.resolve(cmdLineText)) }
    global.browser = {
        url: jest.fn(),
        $: jest.fn().mockReturnValue(elemMock),
        capabilities: {}
    }

    const result = await findCDPInterface()
    expect(global.browser.url.mock.calls).toHaveLength(1)
    expect(global.browser.$.mock.calls).toHaveLength(1)
    expect(elemMock.getText.mock.calls).toHaveLength(1)
    expect(result).toEqual({ host: 'localhost', port: 1234 })
})

test('findCDPInterface with DevToolsActivePort', async () => {
    const cmdLineText = format(COMMAND_LINE_TEXT, 0)
    const elemMock = { getText: jest.fn().mockReturnValue(Promise.resolve(cmdLineText)) }
    global.browser = {
        url: jest.fn(),
        $: jest.fn().mockReturnValue(elemMock),
        capabilities: {}
    }

    const result = await findCDPInterface()
    expect(result).toEqual({ host: 'localhost', port: 1234 })
})

test('findCDPInterface with goog:chromeOptions data', async () => {
    global.browser = {
        capabilities: {
            'goog:chromeOptions': { debuggerAddress: 'foo.bar:1234' }
        }
    }

    const result = await findCDPInterface()
    expect(result).toEqual({ host: 'foo.bar', port: 1234 })
})

test('sumByKey', () => {
    expect(sumByKey([{
        size: 1
    }, {
        size: 2
    }, {
        size: 3
    }], 'size')).toBe(6)
})

test('readIOStream', async () => {
    const cdpMock = jest.fn()
        .mockReturnValueOnce({ data: '{"foo', eof: false })
        .mockReturnValueOnce({ data: '": "bar"}', eof: true })
    const result = await readIOStream(cdpMock, 1)
    expect(result).toEqual({ foo: 'bar' })
})

describe('isBrowserVersionLower', () => {
    test('should return false if version capability is missing', () => {
        expect(isBrowserVersionLower({})).toBe(false)
    })

    test('should return true if version is lower than required', () => {
        expect(isBrowserVersionLower({ version: 62 }, 63)).toBe(true)
    })

    test('should return false if version is higher than required', () => {
        const versionProps = ['browserVersion', 'browser_version', 'version']
        let browserVersion = 63
        versionProps.forEach(prop => {
            const caps = {}
            caps[prop] = browserVersion
            expect(isBrowserVersionLower(caps, 63)).toBe(false)
            browserVersion++
        })
    })
})

describe('getChromeMajorVersion', () => {
    test('should return whatever value is passed if not a string', () => {
        expect(getChromeMajorVersion({})).toEqual({})
        expect(getChromeMajorVersion(true)).toEqual(true)
        expect(getChromeMajorVersion(78)).toEqual(78)
        expect(getChromeMajorVersion('foobar')).toEqual('foobar')
    })

    test('should return major version if proper version is passed', () => {
        expect(getChromeMajorVersion('78.0.3904.11')).toEqual(78)
        expect(getChromeMajorVersion('100.0')).toEqual(100)
        expect(getChromeMajorVersion('78')).toEqual(78)
    })
})
