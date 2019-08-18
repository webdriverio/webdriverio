const FiberMock = jest.fn().mockImplementation((fn) => {
    return { run: fn }
})

module.exports = FiberMock
