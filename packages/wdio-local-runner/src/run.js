import Runner from 'wdio-runner'
import logger from 'wdio-logger'

const log = logger('wdio-local-runner')

const runner = new Runner()
process.on('message', (m) => {
    runner[m.command](m).catch((e) => {
        log.error(`Failed launching test session:`, e)
        process.exit(1)
    })
})

/**
 * catches ctrl+c event
 */
process.on('SIGINT', () => {
    /**
     * force killing process when 2nd SIGINT comes in
     */
    if (runner.forceKillingProcess) {
        return process.exit(1)
    }

    runner.forceKillingProcess = true
    runner.sigintHandler()
})
