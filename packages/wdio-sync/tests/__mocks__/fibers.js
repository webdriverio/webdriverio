const FiberMock = jest.fn().mockImplementation((fn) => {
    return { run: fn }
})

export default FiberMock
