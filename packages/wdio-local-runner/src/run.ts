import exitHook from 'exit-hook'

import Runner from '@wdio/runner'
import logger from '@wdio/logger'
import type { Workers } from '@wdio/types'

import { SHUTDOWN_TIMEOUT } from './constants.js'

const log = logger('@wdio/local-runner')

/**
 * ToDo(Christian): remove when @wdio/runner got typed
 */
interface RunnerInterface extends NodeJS.EventEmitter {
    sigintWasCalled: boolean
    [key: string]: unknown
}

/**
 * send ready event to testrunner to start receive command messages
 */
if (typeof process.send === 'function') {
    process.send(<Workers.WorkerMessage>{
        name: 'ready',
        origin: 'worker'
    })
}

export const runner = new Runner() as unknown as RunnerInterface
runner.on('exit', process.exit.bind(process))
runner.on('error', ({ name, message, stack }) => process.send!({
    origin: 'worker',
    name: 'error',
    content: { name, message, stack }
}))

process.on('message', (m: Workers.WorkerCommand) => {
    if (!m || !m.command || !runner[m.command] || typeof runner[m.command] !== 'function') {
        return
    }

    log.info(`Run worker command: ${m.command}`)
    ;(runner[m.command] as Function)(m).then(
        (result: unknown) => process.send!({
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

/**
 * catch sigint messages as they are handled by main process
 */
exitHook(() => {
    runner.sigintWasCalled = true
    log.info(`Received SIGINT, giving process ${SHUTDOWN_TIMEOUT}ms to shutdown gracefully`)

    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve()
        }, SHUTDOWN_TIMEOUT)
    })
})
