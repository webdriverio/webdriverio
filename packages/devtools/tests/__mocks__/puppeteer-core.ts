const sendMock = jest.fn()
const listenerMock = jest.fn()

const devices = [{
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
}, {
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
}]
devices['Nexus 6P'] = devices[0]
devices['Nexus 6P landscape'] = devices[0]

class CDPSessionMock {
    send = sendMock
    on = listenerMock
    _connection = {
        _transport: {
            _ws: { addEventListener: jest.fn() }
        }
    }
}
const cdpSession = new CDPSessionMock()

class TargetMock {
    page = jest.fn().mockImplementation(() => page)
    createCDPSession = jest.fn().mockImplementation(() => cdpSession)
}
const target = new TargetMock()

class PageMock {
    on = jest.fn()
    close = jest.fn()
    url = jest.fn().mockReturnValue('about:blank')
    emulate = jest.fn()
    setViewport = jest.fn()
    setDefaultTimeout = jest.fn()
    target = jest.fn().mockReturnValue(target)
}
const page = new PageMock()

class PageMock2 extends PageMock {
    url = jest.fn().mockReturnValue('http://json.org')
}
const page2 = new PageMock2()

class PuppeteerMock {
    waitForTarget = jest.fn().mockImplementation(() => target)
    getActivePage = jest.fn().mockImplementation(() => page)
    pages = jest.fn().mockReturnValue(Promise.resolve([page, page2]))
    userAgent = jest.fn().mockImplementation(() => 'MOCK USER AGENT')
    _connection = { _transport: { _ws: { addEventListener: jest.fn() } } }
}

export default {
    CDPSessionMock,
    PageMock,
    TargetMock,
    PuppeteerMock,
    sendMock,
    listenerMock,
    devices,
    registerCustomQueryHandler: jest.fn(),
    unregisterCustomQueryHandler: jest.fn(),
    launch: jest.fn().mockImplementation(
        () => Promise.resolve(new PuppeteerMock())),
    connect: jest.fn().mockImplementation(
        () => Promise.resolve(new PuppeteerMock()))
}
