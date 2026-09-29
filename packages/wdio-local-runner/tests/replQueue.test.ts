import type { ChildProcess } from 'node:child_process'
import { expect, test, vi, afterEach } from 'vitest'

import ReplQueue from '../src/replQueue.js'
import WDIORunnerRepl from '../src/repl.js'

afterEach(() => {
    vi.restoreAllMocks()
})

test('runs debug sessions one at a time', async () => {
    const start = vi.spyOn(WDIORunnerRepl.prototype, 'start').mockResolvedValue(undefined as never)
    const queue = new ReplQueue()
    const onStart = vi.fn()
    const onEnd = vi.fn()
    const onStart2 = vi.fn()
    const onEnd2 = vi.fn()
    const childProcess = { send: vi.fn() } as unknown as ChildProcess
    const childProcess2 = { send: vi.fn() } as unknown as ChildProcess

    queue.add(childProcess, { prompt: 'a' } as any, onStart, onEnd)
    queue.add(childProcess2, { prompt: 'b' } as any, onStart2, onEnd2)

    expect(queue.isRunning).toBe(false)
    queue.next()
    expect(queue.runningRepl?.childProcess).toBe(childProcess)
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart2).not.toHaveBeenCalled()
    expect(queue.isRunning).toBe(true)
    expect(start).toHaveBeenCalledTimes(1)

    queue.next()
    expect(onStart2).not.toHaveBeenCalled()

    await Promise.resolve()
    expect(childProcess.send).toHaveBeenCalledWith({ origin: 'debugger', name: 'stop' })
    expect(onEnd).toHaveBeenCalledWith({ origin: 'debugger', name: 'stop' })
    expect(onStart2).toHaveBeenCalledTimes(1)
    expect(queue.runningRepl?.childProcess).toBe(childProcess2)
    expect(onEnd2).not.toHaveBeenCalled()
    expect(queue.isRunning).toBe(true)

    await Promise.resolve()
    expect(childProcess2.send).toHaveBeenCalledWith({ origin: 'debugger', name: 'stop' })
    expect(onEnd2).toHaveBeenCalledTimes(1)
    expect(queue.isRunning).toBe(false)

    queue.next()
    expect(start).toHaveBeenCalledTimes(2)
})
