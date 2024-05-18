import { vi } from 'vitest'

const sendMock = vi.fn()
const listenerMock = vi.fn()

export const KnownDevices = {
    'Nexus 6P': {
        name: 'Nexus 6P',
        userAgent: 'Mozilla/5.0 (Linux; Android 8.0.0; Nexus 6P Build/OPP3.170518.006) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3765.0 Mobile Safari/537.36',
        viewport: {
            width: 412,
            height: 732,
            deviceScaleFactor: 3.5,
            isMobile: true,
            hasTouch: true,
            isLandscape: false
        }
    },
    'Nexus 6P landscape' : {
        name: 'Nexus 6P landscape',
        userAgent: 'Mozilla/5.0 (Linux; Android 8.0.0; Nexus 6P Build/OPP3.170518.006) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3765.0 Mobile Safari/537.36',
        viewport: {
            width: 732,
            height: 412,
            deviceScaleFactor: 3.5,
            isMobile: true,
            hasTouch: true,
            isLandscape: true
        }
    }
}

class CDPSessionMock {
    send = sendMock
    on = listenerMock
    _connection = {
        _transport: {
            _ws: { addEventListener: vi.fn() }
        }
    }
}
const cdpSession = new CDPSessionMock()

class TargetMock {
    page = vi.fn().mockImplementation(() => page)
    asPage = vi.fn().mockImplementation(async () => page)
    createCDPSession = vi.fn().mockImplementation(() => cdpSession)
}
const target = new TargetMock()

class PageMock {
    on = vi.fn()
    off = vi.fn()
    close = vi.fn()
    url = vi.fn().mockReturnValue('about:blank')
    emulate = vi.fn()
    setViewport = vi.fn()
    setDefaultTimeout = vi.fn()
    target = vi.fn().mockReturnValue(target)
}
const page = new PageMock()

class PageMock2 extends PageMock {
    url = vi.fn().mockReturnValue('http://json.org')
}
const page2 = new PageMock2()

class PuppeteerMock {
    on = vi.fn()
    off = vi.fn()
    waitForTarget = vi.fn().mockImplementation(() => target)
    getActivePage = vi.fn().mockImplementation(() => page)
    pages = vi.fn().mockReturnValue(Promise.resolve([page, page2]))
    userAgent = vi.fn().mockImplementation(() => 'MOCK USER AGENT')
    wsEndpoint = vi.fn().mockReturnValue('ws://some/path/to/cdp')
}

export class Puppeteer {
    static registerCustomQueryHandler = vi.fn()
    static unregisterCustomQueryHandler = vi.fn()
}

export default {
    CDPSessionMock,
    PageMock,
    TargetMock,
    PuppeteerMock,
    sendMock,
    listenerMock,
    launch: vi.fn().mockImplementation(
        () => Promise.resolve(new PuppeteerMock())),
    connect: vi.fn().mockImplementation(
        () => Promise.resolve(new PuppeteerMock()))
}
