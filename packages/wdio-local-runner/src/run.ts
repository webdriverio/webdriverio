import { asyncExitHook, gracefulExit } from 'exit-hook'

import logger from '@wdio/logger'
import Runner from '@wdio/runner'
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
runner.on('exit', (code = 0) => gracefulExit(code))
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

process.once('SIGINT', () => {
    runner.sigintWasCalled = true
    gracefulExit(130)
})

/**
 * registers an asynchronous exit hook to allow graceful shutdown
 * if the process is being terminated due to SIGINT, delays exit for SHUTDOWN_TIMEOUT ms to allow cleanup
 * otherwise, exits immediately without delay
 */
asyncExitHook(
    async () => {
        if (runner.sigintWasCalled) {
            log.info(`Received SIGINT, giving process ${SHUTDOWN_TIMEOUT}ms to shutdown gracefully`)

            return await new Promise(res => setTimeout(res, SHUTDOWN_TIMEOUT))
        }
    }, {
        wait: SHUTDOWN_TIMEOUT
    }
)
