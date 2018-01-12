import Runner from 'wdio-runner'
import logger from 'wdio-logger'

const log = logger('wdio-local-runner')

const runner = new Runner()
process.on('message', (m) => {
    runner[m.command](m).catch((e) => {
        log.error(`Failed launching test session:`, e)

        /**
         * custom exit code to propagate initialisation error
         */
        process.send({
            event: 'runner:error',
            error: {
                message: e.message,
                stack: e.stack
            },
            capabilities: runner.configParser.getCapabilities(runner.cid),
            cid: runner.cid,
            specs: runner.specs
        })
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
