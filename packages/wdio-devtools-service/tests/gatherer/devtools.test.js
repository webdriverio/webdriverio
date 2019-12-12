import DevtoolsGatherer from '../../src/gatherer/devtools'

const cdpSessionMock = {
    on: jest.fn()
}

const driverMock = {
    getCDPSession: jest.fn().mockReturnValue(Promise.resolve(cdpSessionMock)),
    send: jest.fn()
}

test('getLogs', () => {
    const gatherer = new DevtoolsGatherer({}, driverMock)
    gatherer.onMessage(1)
    gatherer.onMessage(2)
    gatherer.onMessage(3)
    gatherer.onMessage(4)

    expect(gatherer.logs).toHaveLength(4)

    const logs = gatherer.getLogs()
    expect(logs).toEqual([1, 2, 3, 4])
    expect(gatherer.logs).toHaveLength(0)
})
