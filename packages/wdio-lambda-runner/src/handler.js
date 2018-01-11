import logger from 'wdio-logger'
import Runner from 'wdio-runner'

const log = logger('wdio-lambda-runner')

module.exports.run = (event, context, callback) => {
    const runner = new Runner()

    /**
     * run test
     */
    log.info('Run test with payload', event.data)
    runner.run(event.data)

    callback(null, 'run me')
}
