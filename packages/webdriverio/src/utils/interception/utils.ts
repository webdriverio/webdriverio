import logger from '@wdio/logger'
import { minimatch } from 'minimatch'

const log = logger('webdriverio')

export const logFetchError = (err?: Error) => {
    /* istanbul ignore next */
    log.debug(err?.message)
}

export function isMatchingRequest (expectedUrl: string | RegExp, actualUrl: string) {
    if (typeof expectedUrl === 'string') {
        return minimatch(actualUrl, expectedUrl)
    }
    if (expectedUrl instanceof RegExp) {
        return Boolean(actualUrl.match(expectedUrl))
    }

    throw new Error(`Unexpected type for mock url: ${expectedUrl}`)
}
