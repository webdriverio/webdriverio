class ReplMock {
    start = jest.fn().mockReturnValue({ on: this.on.bind(this) })

    on (event: string, cb: Function) {
        cb(event)
    }
}

export default new ReplMock()
