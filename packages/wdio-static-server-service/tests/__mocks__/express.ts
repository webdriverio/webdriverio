const expressMock = jest.fn().mockReturnValue({
    use: jest.fn(),
    listen: jest.fn().mockImplementation(function (this: unknown, port, cb) {
        if (this === undefined) {
            return cb(
                new Error('This value missing when invoking server.listen()')
            )
        }

        cb()
    })
}) as any

expressMock.static = jest.fn()

export default expressMock
