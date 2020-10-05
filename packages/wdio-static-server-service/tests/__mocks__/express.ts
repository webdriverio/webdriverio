const expressMock = jest.fn().mockReturnValue({
    use: jest.fn(),
    listen: jest.fn().mockImplementation((port, cb) => cb())
})

expressMock.static = jest.fn()

export default expressMock
