class ReplMock {
    constructor() {
        this.start = jest.fn().mockReturnValue({ on: this.on.bind(this) })
    }

    on(event, cb) {
        cb(event)
    }
}

export default new ReplMock()
