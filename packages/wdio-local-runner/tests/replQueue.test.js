import ReplQueue from '../src/replQueue'

test('add', () => {
    const queue = new ReplQueue()
    queue.add(1, 2, 3, 4)
    queue.add(5, 6, 7, 8)
    expect(queue.repls).toEqual([
        { childProcess: 1, options: 2, onStart: 3, onEnd: 4 },
        { childProcess: 5, options: 6, onStart: 7, onEnd: 8 }
    ])
})

test('isRunning', () => {
    const queue = new ReplQueue()
    expect(queue.isRunning).toBe(false)
    queue.runningRepl = true
    expect(queue.isRunning).toBe(true)
})

test('next', async () => {
    const queue = new ReplQueue()
    const startFn = jest.fn()
    const endFn = jest.fn()
    const startFn2 = jest.fn()
    const endFn2 = jest.fn()
    const childProcess = { send: jest.fn() }
    const childProcess2 = { send: jest.fn() }
    queue.add(childProcess, { some: 'option' }, startFn, endFn)
    queue.add(childProcess2, { some: 'option' }, startFn2, endFn2)
    queue.next()

    expect(startFn).toBeCalledTimes(1)
    expect(queue.isRunning).toBe(true)

    queue.next()
    expect(startFn2).toBeCalledTimes(0)

    // wait 100ms to let repl finish (see mock)
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(childProcess.send).toBeCalledWith({
        origin: 'debugger',
        name: 'stop'
    })
    expect(endFn).toBeCalledTimes(1)
    expect(startFn2).toBeCalledTimes(1)
    expect(endFn2).toBeCalledTimes(0)

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(queue.isRunning).toBe(false)
})

// export default class ReplQueue {
//     constructor () {
//         this.runningRepl = null
//         this.repls = []
//     }
//
//     add (childProcess, options, onStart, onEnd) {
//         this.repls.push({ childProcess, options, onStart, onEnd })
//     }
//
//     next () {
//         if (this.isRunning || this.repls.length === 0) {
//             return
//         }
//
//         const { childProcess, options, onStart, onEnd } = this.repls.shift()
//         this.runningRepl = new WDIORepl(childProcess, options)
//
//         onStart()
//         this.runningRepl.start().then(() => {
//             const ev = {
//                 origin: 'debugger',
//                 name: 'stop'
//             }
//             this.runningRepl.childProcess.send(ev)
//             onEnd(ev)
//
//             delete this.runningRepl
//             this.next()
//         })
//     }
//
//     get isRunning () {
//         return Boolean(this.runningRepl)
//     }
// }
