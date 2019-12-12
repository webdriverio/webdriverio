import logger from '@wdio/logger'
import Runner from '@wdio/runner'

const log = logger('@wdio/lambda-runner')

module.exports.run = (event, context, callback) => {
    log.info('Start Lambda function...')
    const runner = new Runner()

    /**
     * run test
     */
    runner.run(event).catch((e) => {
        log.error(`Failed launching test session: ${e.stack}`)
        callback(e)
        context.fail(e)
    })

    runner.on('exit', (failures) => {
        log.info('call the callback', failures)
        callback(null, { failures })
    })
}
