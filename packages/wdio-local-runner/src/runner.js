import logger from 'wdio-logger'

const log = logger('wdio-local-runner')

export default class Runner {
    constructor () {
        this.haltSIGINT = false
        this.sigintWasCalled = false
        this.hasSessionID = false
        this.failures = 0
        this.forceKillingProcess = false
        this.isRunning = false
        this.fileTriggeredWhileRunning = null
    }

    async run (m) {
        log.info('I am running', m)
        process.exit(1)
    }
}

const runner = new Runner()
process.on('message', (m) => {
    runner[m.command](m).catch((e) => {
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
