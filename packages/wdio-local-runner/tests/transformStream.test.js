import RunnerTransformStream from '../src/transformStream'

jest.mock('stream', () => {
    class TransformMock {
        constructor () {
            this.push = jest.fn()
        }
    }

    return { Transform: TransformMock }
})

test('should add cid to message', () => {
    const stream = new RunnerTransformStream('0-5')
    const cb = jest.fn()
    stream._transform('foobar', null, cb)
    expect(stream.push).toBeCalledWith('[0-5] foobar')
    expect(cb).toBeCalled()
})
