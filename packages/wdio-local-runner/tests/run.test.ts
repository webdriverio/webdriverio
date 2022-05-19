import path from 'node:path'
import exitHook from 'async-exit-hook'
import { beforeAll, expect, test, afterAll, vi } from 'vitest'

// @ts-ignore mock exports instances, package doesn't
import { instances } from '@wdio/runner'

vi.mock('@wdio/runner', () => import(path.join(process.cwd(), '__mocks__', '@wdio/runner')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../src/constants', () => ({
    SHUTDOWN_TIMEOUT: 1
}))

const sleep = (ms = 100) => new Promise(
    (resolve) => setTimeout(resolve, ms))

let exitHookFn: Function
let runner: any
const origExit = process.exit.bind(process)

beforeAll(async () => {
    vi.spyOn(process, 'on')
    process.send = vi.fn()
    process.exit = vi.fn() as any
    const run = await import('../src/run')
    exitHookFn = run.exitHookFn
    runner = run.runner
})

test.skip('should register exitHook', () => {
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
    vi.mocked(process.on).mock.calls[0][1](false)
})

test('should call runner command on process message', async () => {
    expect(instances[0].run).toHaveBeenCalledTimes(0)
    vi.mocked(process.on).mock.calls[0][1]({
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

test('should exit process if failing to execute', async () => {
    runner.errorMe = vi.fn().mockReturnValue(Promise.reject(new Error('Uups')))
    vi.mocked(process.on).mock.calls[0][1]({
        command: 'errorMe',
        foo: 'bar'
    })
    expect(instances[0].errorMe).toHaveBeenCalledTimes(1)
    await sleep()
    expect(process.exit).toBeCalledWith(1)

})

test('exitHookFn do nothing if no callback is provided', async () => {
    exitHookFn()
    await sleep()
    expect(runner.sigintWasCalled).toBe(undefined)
})

test('exitHookFn should call callback after shutdown timeout', async () => {
    const cb = vi.fn()
    exitHookFn(cb)
    expect(runner.sigintWasCalled).toBe(true)
    expect(cb).toHaveBeenCalledTimes(0)
    await sleep()
    expect(cb).toHaveBeenCalledTimes(1)
})

afterAll(() => {
    vi.mocked(process.on).mockRestore()
    vi.mocked(process.send)!.mockRestore()
    process.exit = origExit
})
