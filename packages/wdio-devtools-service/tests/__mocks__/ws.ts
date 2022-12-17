export default class WebSocketMock {
    on = jest.fn().mockReturnValue({ off: jest.fn() })
    off = jest.fn()
    send = jest.fn()

    constructor (public wsUrl: string) {}
}
