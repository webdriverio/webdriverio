import path from 'node:path'
import { afterAll, beforeAll, expect, test, vi } from 'vitest'

// @ts-ignore mock exports instances, package doesn't
import { instances } from '@wdio/runner'

vi.mock('@wdio/runner', () => import(path.join(process.cwd(), '__mocks__', '@wdio/runner')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

let exitHookCallback: Function | undefined
const exitHookMock = vi.fn((callback: Function) => {
    exitHookCallback = callback
    return () => {} // return unsubscribe function
})

const gracefulExitMock = vi.fn()

vi.mock('exit-hook', () => ({
    default: exitHookMock,
    asyncExitHook: exitHookMock,
    gracefulExit: gracefulExitMock
}))

vi.mock('../src/constants', () => ({
    SHUTDOWN_TIMEOUT: 10
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

test('should call gracefulExit with exit code on exit', () => {
    const exitListener = instances[0].on.mock.calls.find(([event]: [string]) => event === 'exit')?.[1]
    expect(exitListener).toBeDefined()
    exitListener?.(5)
    expect(gracefulExitMock).toHaveBeenCalledWith(5)
})

test('should call gracefulExit(130) and set sigintWasCalled on SIGINT', () => {
    // Find SIGINT listener
    const sigintListener = vi.mocked(process.on).mock.calls.find(([event]) => event === 'SIGINT')?.[1]
    expect(sigintListener).toBeDefined()
    sigintListener?.()
    expect(runner.sigintWasCalled).toBe(true)
    expect(gracefulExitMock).toHaveBeenCalledWith(130)
})

test('should delay shutdown in exitHook if SIGINT was received', async () => {
    runner.sigintWasCalled = true
    const startTime = Date.now()
    await exitHookCallback?.()
    const endTime = Date.now()
    // Should wait at least SHUTDOWN_TIMEOUT (10ms in test due to mock)
    expect(endTime - startTime).toBeGreaterThanOrEqual(10)
})

test('should not delay in exitHook if SIGINT was not received', async () => {
    runner.sigintWasCalled = false
    const start = Date.now()
    await exitHookCallback?.()
    const end = Date.now()
    // Should not wait (almost immediate) when sigintWasCalled = false
    expect(end - start).toBeLessThan(10)
})

afterAll(() => {
    vi.mocked(process.on).mockRestore()
    vi.mocked(process.send)!.mockRestore()
    gracefulExitMock.mockReset()
    process.exit = origExit
})
