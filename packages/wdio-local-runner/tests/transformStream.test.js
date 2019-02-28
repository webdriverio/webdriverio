import RunnerTransformStream from '../src/transformStream'
import { DEBUGGER_MESSAGES } from '../src/constants'

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

test('should ignore debugger messages', () => {
    const stream = new RunnerTransformStream('0-5')
    const cb = jest.fn()
    DEBUGGER_MESSAGES.forEach(m => stream._transform(`${m} foobar`, null, cb))
    expect(stream.push).toBeCalledTimes(0)
})
