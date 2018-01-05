import logger from 'wdio-logger'

const log = logger('wdio-cli:BaseReporter')

export default class BaseReporter {
    handleEvent (...args) {
        log.debug(args)
    }
}
