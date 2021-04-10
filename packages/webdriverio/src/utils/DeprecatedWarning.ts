import logger from '@wdio/logger'

const log = logger('deprecated')

export class DeprecatedWarning {
    constructor(message: string) {
        log.warn('@DeprecatedWarning: ' + message)
    }
}
