import RunnerTransformStream from '../src/transformStream'
import { DEBUGGER_MESSAGES } from '../src/constants'

const expect = global.expect as unknown as jest.Expect

test('should add cid to message', () => {
    const stream = new RunnerTransformStream('0-5')
    const cb = jest.fn()
    const pushSpy = jest.spyOn(stream, 'push')

    stream._transform('foobar', 'utf8', cb)
    expect(pushSpy).toBeCalledWith('[0-5] foobar')
    expect(cb).toBeCalled()
})

test('should ignore debugger messages', () => {
    const stream = new RunnerTransformStream('0-5')
    const cb = jest.fn()
    const pushSpy = jest.spyOn(stream, 'push')

    DEBUGGER_MESSAGES.forEach(m => stream._transform(`${m} foobar`, 'utf8', cb))
    expect(pushSpy).toBeCalledTimes(0)
})

test('should unpipe in the end', (done) => {
    const stream = new RunnerTransformStream('0-5')
    const stream2 = new RunnerTransformStream('0-6')

    stream2.pipe(stream)
    const cb = jest.fn()
    stream.on('unpipe', cb)

    const finalSpy = jest.spyOn(stream, '_final')

    stream.end(() => {
        expect(cb).toBeCalled()
        expect(finalSpy).toBeCalled()
        done()
    })
})
