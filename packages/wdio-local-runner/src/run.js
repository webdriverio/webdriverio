import Runner from 'wdio-runner'
import logger from 'wdio-logger'

const log = logger('wdio-local-runner')

let forceKillingProcess = false

const runner = new Runner()
process.on('message', (m) => {
    runner[m.command](m).catch((e) => {
        log.error(`Failed launching test session:`, e)
        process.exit(1)
    })

    runner.on('exit', ::process.exit)
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
     * if session is currently in booting process don't do anythign
     */
    if (!global.browser) {
        return
    }

    return runner.kill()
})
