import Runner from '@wdio/runner'
import logger from '@wdio/logger'
import type { Workers } from '@wdio/types'
import EventEmitter from 'node:events'
import { runWithProcessContext } from './processProxy.js'
import { PassThrough } from 'node:stream'
import { _runInGlobalStorage } from '@wdio/globals'

const log = logger('@wdio/lite-runner')

/**
 * ToDo(Christian): remove when @wdio/runner got typed
 */
interface RunnerInterface extends NodeJS.EventEmitter {
    sigintWasCalled: boolean
    [key: string]: any
}

export function run (env: {[key: string]: string}) {
    const stdout = new PassThrough()
    const stderr = new PassThrough()
    const internalChildProcessEvents = new EventEmitter()
    const externalChildProcessEvents = new EventEmitter()

    const internalChildProcess = {
        send: (arg: unknown) => {
            runWithProcessContext({}, () => externalChildProcessEvents.emit('message', arg))
        },
        env,
        stdout,
        stderr,
        kill: (arg: unknown) => runWithProcessContext({}, () => externalChildProcessEvents.emit('exit', arg)),
    } as any

    const childProcess = {
        send : (arg: unknown) => runWithProcessContext(internalChildProcess, () => internalChildProcessEvents.emit('message', arg)),
        stdout,
        stderr,
        on: function() {externalChildProcessEvents.on.call(externalChildProcessEvents, ...arguments)},
        kill: () => {}
    }

    //Shim the process EventEmitter for the child process
    for (const p in internalChildProcessEvents) {
        const obj = internalChildProcessEvents as any
        if (typeof obj[p] === 'function') {
            const patchedFn = obj[p] as Function
            internalChildProcess[p] = function() {
                runWithProcessContext({}, () => patchedFn.apply(internalChildProcessEvents, arguments))
            }
        } else {
            internalChildProcess.p = obj[p]
        }
    }

    const runner = new Runner() as unknown as RunnerInterface
    runner.on('error', ({ name, message, stack }) => internalChildProcess.send!({
        origin: 'worker',
        name: 'error',
        content: { name, message, stack }
    }))

    internalChildProcess.on('message', (m: Workers.WorkerCommand) => {
        if (!m || !m.command || !runner[m.command]) {
            return
        }

        log.info(`Run worker command: ${m.command}`)
        runWithProcessContext(internalChildProcess, () => {
            _runInGlobalStorage(new Map(), () => {
                runner[m.command](m).then(
                    (result: any) => internalChildProcess.send!({
                        origin: 'worker',
                        name: 'finishedCommand',
                        content: {
                            command: m.command,
                            result
                        }
                    }),
                    (e: Error) => {
                        log.error(`Failed launching test session: ${e.stack}`)
                        setTimeout(() => process.exit(1), 10)
                    }
                )
            })

        })
    })

    setImmediate(() => {
        internalChildProcess.send(<Workers.WorkerMessage>{
            name: 'ready',
            origin: 'worker'
        })
    })

    return childProcess
}
