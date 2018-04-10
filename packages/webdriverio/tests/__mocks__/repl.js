class ReplMock {
    constructor () {
        this.start = jest.fn().mockReturnValue({ on: ::this.on })
    }

    on (event, cb) {
        cb(event)
    }
}

export default new ReplMock()
