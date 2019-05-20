const sendMock = jest.fn()
const listenerMock = jest.fn()

class CDPSessionMock {
    constructor () {
        this.send = sendMock
        this.on = listenerMock
    }
}

class PageMock {
    constructor () {
        this.on = jest.fn()
    }
}

class TargetMock {
    constructor () {
        this.page = jest.fn().mockImplementation(() => new PageMock())
        this.createCDPSession = jest.fn().mockImplementation(() => new CDPSessionMock())
    }
}

class PuppeteerMock {
    constructor () {
        this.waitForTarget = jest.fn().mockImplementation(() => new TargetMock())
        this.getActivePage = jest.fn().mockImplementation(() => new PageMock())
    }
}

export default {
    CDPSessionMock,
    PageMock,
    TargetMock,
    PuppeteerMock,
    sendMock,
    listenerMock,
    connect: jest.fn().mockImplementation(
        () => Promise.resolve(new PuppeteerMock()))
}
