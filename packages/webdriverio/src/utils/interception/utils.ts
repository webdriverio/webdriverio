import logger from '@wdio/logger'

const log = logger('webdriverio')

export const logFetchError = (err?: Error) => {
    /* istanbul ignore next */
    log.debug(err?.message)
}
