import Runner from '@wdio/runner'
import logger from '@wdio/logger'
import type { Workers } from '@wdio/types'
import EventEmitter from 'node:events'
import { runWithProcessContext } from './processProxy.js'
import type { Readable } from 'node:stream'
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

export interface IsolatedProcess {
    emitter: EventEmitter,
    stdout: Readable,
    stderr: Readable,
}

export function run (env: {[key: string]: string}): IsolatedProcess {
    const stdout = new PassThrough()
    const stderr = new PassThrough()
    const emitter = new EventEmitter()
    const send = function (arg: any) {
        runWithProcessContext({}, () => emitter.emit('send', arg))
    }
    const ctx = {
        send: (arg: unknown) => {
            runWithProcessContext({}, () => send(arg))
        },
        env,
        stdout,
        stderr,
        kill: (arg: any) => runWithProcessContext({}, () => emitter.emit('exit', arg))
    } as any

    const runner = new Runner() as unknown as RunnerInterface
    runner.on('error', ({ name, message, stack }) => send!({
        origin: 'worker',
        name: 'error',
        content: { name, message, stack }
    }))

    emitter.on('message', (m: Workers.WorkerCommand) => {
        if (!m || !m.command || !runner[m.command]) {
            return
        }

        log.info(`Run worker command: ${m.command}`)
        runWithProcessContext(ctx, () => {
            _runInGlobalStorage(new Map(), () => {
                runner[m.command](m).then(
                    (result: any) => send!({
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

    return {
        emitter,
        stdout,
        stderr
    }
}
