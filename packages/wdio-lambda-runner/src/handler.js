// import logger from 'wdio-logger'
import Runner from 'wdio-runner'

// const log = logger('wdio-lambda-runner')

module.exports.run = (event, context, callback) => {
    const runner = new Runner()

    /**
     * run test
     */
    runner.run(event)
    runner.on('message', (data) => {
        if (data.event === 'end') {
            callback(null, data)
        }
    })
}
