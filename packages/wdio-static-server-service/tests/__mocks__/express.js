const expressMock = jest.fn().mockReturnValue({
    use: jest.fn(),
    listen: jest.fn()
})

expressMock.static = jest.fn()

export default expressMock
