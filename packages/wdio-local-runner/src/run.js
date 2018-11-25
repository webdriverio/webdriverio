import exitHook from 'async-exit-hook'

import Runner from '@wdio/runner'
import logger from '@wdio/logger'

import { SHUTDOWN_TIMEOUT } from './constants'

const log = logger('wdio-local-runner')

const runner = new Runner()
process.on('message', (m) => {
    log.info(`Run worker command: ${m.command}`)
    runner[m.command](m).then(
        (result) => process.send({
            origin: 'worker',
            name: 'finisedCommand',
            content: {
                command: m.command,
                result
            }
        }),
        (e) => {
            log.error(`Failed launching test session:`, e)
            process.exit(1)
        }
    )

    runner.on('exit', ::process.exit)
    runner.on('error', ({ name, message, stack }) => process.send({
        origin: 'worker',
        name: 'error',
        content: { name, message, stack }
    }))
})

/**
 * catch sigint messages as they are handled by main process
 */
exitHook((callback) => {
    log.info(`Received SIGINT, giving process ${SHUTDOWN_TIMEOUT}ms to shutdown gracefully`)
    setTimeout(callback, SHUTDOWN_TIMEOUT)
})
