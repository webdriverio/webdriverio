import type { ChildProcess } from 'child_process'

import ReplQueue from '../src/replQueue'

test('add', () => {
    const queue = new ReplQueue()
    queue.add(1 as unknown as ChildProcess, 2, 3 as unknown as Function, 4 as unknown as Function)
    queue.add(5 as unknown as ChildProcess, 6, 7 as unknown as Function, 8 as unknown as Function)
    expect(queue['_repls']).toEqual([
        { childProcess: 1, options: 2, onStart: 3, onEnd: 4 },
        { childProcess: 5, options: 6, onStart: 7, onEnd: 8 }
    ] as any)
})

test('isRunning', () => {
    const queue = new ReplQueue()
    expect(queue.isRunning).toBe(false)
    queue.runningRepl = true as any
    expect(queue.isRunning).toBe(true)
})

test('next', async () => {
    const queue = new ReplQueue()
    const startFn = jest.fn()
    const endFn = jest.fn()
    const startFn2 = jest.fn()
    const endFn2 = jest.fn()
    const childProcess = { send: jest.fn() } as unknown as ChildProcess
    const childProcess2 = { send: jest.fn() } as unknown as ChildProcess
    queue.add(childProcess, { some: 'option' }, startFn, endFn)
    queue.add(childProcess2, { some: 'option' }, startFn2, endFn2)
    queue.next()

    expect(startFn).toHaveBeenCalledTimes(1)
    expect(queue.isRunning).toBe(true)

    queue.next()
    expect(startFn2).toHaveBeenCalledTimes(0)

    // wait 100ms to let repl finish (see mock)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(childProcess.send).toHaveBeenCalledWith({
        origin: 'debugger',
        name: 'stop'
    })
    expect(endFn).toHaveBeenCalledTimes(1)
    expect(startFn2).toHaveBeenCalledTimes(1)
    expect(endFn2).toHaveBeenCalledTimes(0)

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(queue.isRunning).toBe(false)

    /**
     * should not continue if repl is undefined
     */
    queue['_repls'].push(undefined as any)
    delete queue.runningRepl
    queue.next()
})
