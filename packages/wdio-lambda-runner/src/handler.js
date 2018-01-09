import logger from 'wdio-logger'

const log = logger('wdio-lambda-runner:Handler')

module.exports.run = (event, context, callback) => {
    callback(null, 'foobar' + typeof log)
}
