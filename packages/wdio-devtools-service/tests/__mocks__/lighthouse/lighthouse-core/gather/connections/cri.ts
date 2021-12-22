export default class ChromeProtocolMock {
    _runJsonCommand: jest.Mock
    _connectToSocket: jest.Mock

    constructor (port: number, hostname: string) {
        expect(typeof port).toBe('string')
        expect(typeof hostname).toBe('string')
        this._runJsonCommand = jest.fn().mockResolvedValue([{
            foo: 'bar'
        }])
        this._connectToSocket = jest.fn()
    }
}
