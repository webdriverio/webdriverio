import exitHook from 'async-exit-hook'

import Runner from '@wdio/runner'
import logger from '@wdio/logger'

import { SHUTDOWN_TIMEOUT } from './constants'

const log = logger('@wdio/local-runner')

const runner = new Runner()
runner.on('exit', ::process.exit)
runner.on('error', ({ name, message, stack }) => process.send({
    origin: 'worker',
    name: 'error',
    content: { name, message, stack }
}))

process.on('message', (m) => {
    if (!m || !m.command) {
        return log.info('Ignore message for worker:', m)
    }

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
            log.error(`Failed launching test session: ${e.stack}`)
            process.exit(1)
        }
    )
})

/**
 * catch sigint messages as they are handled by main process
 */
exitHook((callback) => {
    if (!callback) {
        return
    }

    runner.sigintWasCalled = true
    log.info(`Received SIGINT, giving process ${SHUTDOWN_TIMEOUT}ms to shutdown gracefully`)
    setTimeout(callback, SHUTDOWN_TIMEOUT)
})
