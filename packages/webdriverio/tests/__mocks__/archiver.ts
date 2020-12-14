const mock = {}
mock.on = jest.fn().mockReturnValue(mock)
mock.append = jest.fn().mockReturnValue(mock)
mock.finalize = jest.fn().mockReturnValue(mock)

export default (...args) => {
    mock.args = args
    return mock
}
