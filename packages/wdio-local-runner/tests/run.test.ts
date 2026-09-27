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

/**
 * `run.js` registers its listeners once, on import. Keep them by event name,
 * since mocks are cleared before each test.
 */
type Listener = (...args: any[]) => unknown
const findListener = (mock: { mock: { calls: unknown[][] } }, event: string) =>
    mock.mock.calls.find(([name]) => name === event)?.[1] as Listener
let onMessage: Listener
let onSigint: Listener
let onRunnerExit: Listener
let onRunnerError: Listener

beforeAll(async () => {
    vi.spyOn(process, 'on')
    process.send = vi.fn()
    process.exit = vi.fn() as any

    const run = await import('../src/run.js')
    runner = run.runner

    onMessage = findListener(vi.mocked(process.on), 'message')
    onSigint = findListener(vi.mocked(process.on), 'SIGINT')
    onRunnerExit = findListener(instances[0].on, 'exit')
    onRunnerError = findListener(instances[0].on, 'error')
})

test('should register the exit hook and listeners', () => {
    expect(exitHookCallback).toBeInstanceOf(Function)
    expect(onMessage).toBeInstanceOf(Function)
    expect(onSigint).toBeInstanceOf(Function)
    expect(onRunnerExit).toBeInstanceOf(Function)
    expect(onRunnerError).toBeInstanceOf(Function)
})

test('should forward runner errors to the parent process', () => {
    onRunnerError({ name: 'name', message: 'message', stack: 'stack' })
    expect(process.send).toHaveBeenCalledWith({
        origin: 'worker',
        name: 'error',
        content: { name: 'name', message: 'message', stack: 'stack' }
    })
})

test('should not call runner if message is undefined', () => {
    onMessage(false)
    expect(instances[0].run).not.toHaveBeenCalled()
})

test('should call runner command on process message', async () => {
    onMessage({
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
    onMessage({
        command: 'errorMe',
        foo: 'bar'
    })
    expect((await instances[0]).errorMe).toHaveBeenCalledTimes(1)
    await sleep()
    expect(gracefulExitMock).toBeCalledWith(1)

})

test('should call gracefulExit with exit code on exit', () => {
    onRunnerExit(5)
    expect(gracefulExitMock).toHaveBeenCalledWith(5)
})

test('should call gracefulExit(130) and set sigintWasCalled on SIGINT', () => {
    onSigint()
    expect(runner.sigintWasCalled).toBe(true)
    expect(gracefulExitMock).toHaveBeenCalledWith(130)
})

test('should delay shutdown in exitHook if SIGINT was received', async () => {
    runner.sigintWasCalled = true
    const startTime = process.hrtime.bigint()
    await exitHookCallback?.()
    const endTime = process.hrtime.bigint()
    // Should wait at least SHUTDOWN_TIMEOUT (10ms in test due to mock)
    // Use nanosecond precision and allow for 9ms minimum to account for timing variance
    const elapsedMs = Number(endTime - startTime) / 1_000_000
    expect(elapsedMs).toBeGreaterThanOrEqual(9)
})

test('should not delay in exitHook if SIGINT was not received', async () => {
    runner.sigintWasCalled = false
    const startTime = process.hrtime.bigint()
    await exitHookCallback?.()
    const endTime = process.hrtime.bigint()
    // Should not wait (almost immediate) when sigintWasCalled = false
    // Allow up to 5ms for normal async overhead
    const elapsedMs = Number(endTime - startTime) / 1_000_000
    expect(elapsedMs).toBeLessThan(5)
})

afterAll(() => {
    vi.mocked(process.on).mockRestore()
    vi.mocked(process.send)!.mockRestore()
    gracefulExitMock.mockReset()
    process.exit = origExit
})
