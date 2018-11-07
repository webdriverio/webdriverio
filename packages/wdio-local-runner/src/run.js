import Runner from '@wdio/runner'
import logger from '@wdio/logger'

const log = logger('wdio-local-runner')

let forceKillingProcess = false

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
 * catches ctrl+c event
 */
process.on('SIGINT', () => {
    /**
     * force killing process when 2nd SIGINT comes in
     */
    if (forceKillingProcess) {
        return process.exit(1)
    }

    forceKillingProcess = true
    runner.sigintWasCalled = true

    /**
     * if session is currently in booting process don't do anything
     * and let runner close the session again
     */
    if (!global.browser) {
        return
    }

    return process.exit(1)
})
