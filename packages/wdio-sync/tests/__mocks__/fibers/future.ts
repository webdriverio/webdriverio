const returnValues = {
    wait: undefined
}

class Future {
    public wait = jest.fn().mockImplementation(
        () => (returnValues.wait instanceof Error)
            ? Promise.reject(returnValues.wait)
            : Promise.resolve(returnValues.wait)
    )
    public return = jest.fn()
    public throw = jest.fn()
}

// @ts-expect-error
Future.returnValues = returnValues

module.exports = Future
