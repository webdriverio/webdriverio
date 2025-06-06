import path from 'node:path'
import { beforeAll, expect, test, afterAll, vi } from 'vitest'

// @ts-ignore mock exports instances, package doesn't
import { instances } from '@wdio/runner'

vi.mock('@wdio/runner', () => import(path.join(process.cwd(), '__mocks__', '@wdio/runner')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

let exitHookCallback: Function | undefined
const exitHookMock = vi.fn((callback: Function) => {
    exitHookCallback = callback
    return () => {} // return unsubscribe function
})

vi.mock('exit-hook', () => ({
    default: exitHookMock
}))

vi.mock('../src/constants', () => ({
    SHUTDOWN_TIMEOUT: 1
}))

const sleep = (ms = 100) => new Promise(
    (resolve) => setTimeout(resolve, ms))

let runner: any
const origExit = process.exit.bind(process)

beforeAll(async () => {
    vi.spyOn(process, 'on')
    process.send = vi.fn()
    process.exit = vi.fn() as any

    const run = await import('../src/run.js')
    runner = run.runner
})

test('should register exitHook', () => {
    expect(exitHookMock).toHaveBeenCalled()
    expect(exitHookCallback).toBeDefined()
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
        name: 'finishedCommand',
        content: { command: 'run', result: { foo: 'bar' } }
    })
})

test('should exit process if failing to execute', async () => {
    runner.errorMe = vi.fn().mockReturnValue(Promise.reject(new Error('Uups')))
    vi.mocked(process.on).mock.calls[0][1]({
        command: 'errorMe',
        foo: 'bar'
    })
    expect((await instances[0]).errorMe).toHaveBeenCalledTimes(1)
    await sleep()
    expect(process.exit).toBeCalledWith(1)

})

test('exitHook should set sigintWasCalled when triggered', async () => {
    expect(runner.sigintWasCalled).toBe(undefined)

    // Trigger the exit hook callback
    if (exitHookCallback) {
        const promise = exitHookCallback()
        expect(runner.sigintWasCalled).toBe(true)

        // The callback should return a promise that resolves after SHUTDOWN_TIMEOUT
        expect(promise).toBeInstanceOf(Promise)
        await promise
    }
})

test('exitHook should wait for shutdown timeout', async () => {
    if (exitHookCallback) {
        const startTime = Date.now()
        await exitHookCallback()
        const endTime = Date.now()

        // Should wait at least SHUTDOWN_TIMEOUT (1ms in test due to mock)
        expect(endTime - startTime).toBeGreaterThanOrEqual(1)
    }
})

afterAll(() => {
    vi.mocked(process.on).mockRestore()
    vi.mocked(process.send)!.mockRestore()
    process.exit = origExit
})
