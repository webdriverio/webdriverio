import exitHook from 'async-exit-hook'
import { instances } from '@wdio/runner'

beforeAll(() => {
    jest.spyOn(process, 'on')
    jest.spyOn(process, 'send')
    require('../src/run.js')
})

test('should register exitHook', () => {
    expect(exitHook).toHaveBeenCalled()
})

test('should have registered runner listener', () => {
    expect(instances[0].on).toHaveBeenCalledWith('exit', expect.any(Function))
    expect(instances[0].on).toHaveBeenCalledWith('error', expect.any(Function))
    instances[0].on.mock.calls[1][1]({ name: 'name', message: 'message', stack: 'stack' })
    expect(process.send).toHaveBeenCalledWith({
        origin: 'worker',
        name: 'error',
        content: { name: 'name', message: 'message', stack: 'stack' }
    })
})

test('should not call runner if message is undefined', () => {
    process.on.mock.calls[0][1](false)
})

test('should call runner command on process message', async () => {
    expect(instances[0].run).toHaveBeenCalledTimes(0)
    process.on.mock.calls[0][1]({
        command: 'run',
        foo: 'bar'
    })
    expect(instances[0].run).toHaveBeenCalledTimes(1)
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(process.send).toHaveBeenCalledWith({
        origin: 'worker',
        name: 'finisedCommand',
        content: { command: 'run', result: { foo: 'bar' } }
    })
})

afterAll(() => {
    process.on.mockRestore()
    process.send.mockRestore()
})
