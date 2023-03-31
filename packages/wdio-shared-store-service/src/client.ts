import type { Response } from 'got'
import got from 'got'
import logger from '@wdio/logger'

import type { JsonCompatible, JsonPrimitive, JsonObject, JsonArray } from '@wdio/types'

const log = logger('@wdio/shared-store-service')

const WAIT_INTERVAL = 100
const pendingValues = new Map<string, any>()
let waitTimeout: NodeJS.Timer

let baseUrl: string | undefined
export const setPort = (port: number) => { baseUrl = `http://localhost:${port}` }

/**
 * make a request to the server to get a value from the store
 * @param   {string} key
 * @returns {*}
 */
export const getValue = async (key: string): Promise<string | number | boolean | JsonObject | JsonArray | null | undefined> => {
    const res = await got.post(`${baseUrl}/get`, { json: { key }, responseType: 'json' }).catch(errHandler)
    return res?.body ? (res.body as JsonObject).value : undefined
}

/**
 * make a request to the server to set a value to the store
 * @param {string}  key
 * @param {*}       value `store[key]` value (plain object)
 */
export const setValue = async (key: string, value: JsonCompatible | JsonPrimitive) => {
    /**
     * if someone calls `setValue` in `onPrepare` we don't have a base url
     * set as the launcher is called after user hooks. In this case we need
     * to wait until it is set and flush all messages.
     */
    if (baseUrl) {
        return got.post(`${baseUrl}/set`, { json: { key, value } }).catch(errHandler)
    }

    log.info('Shared store server not yet started, collecting value')
    pendingValues.set(key, value)

    if (waitTimeout) {
        return
    }

    log.info('Check shared store server to start')
    waitTimeout = setInterval(async () => {
        if (!baseUrl) {
            return
        }

        log.info(`Shared store server started, flushing ${pendingValues.size} values`)
        clearInterval(waitTimeout)
        await Promise.all([...pendingValues.entries()].map(async ([key, value]) => {
            await got.post(`${baseUrl}/set`, { json: { key, value } }).catch(errHandler)
            pendingValues.delete(key)
        })).then(
            () => log.info('All pending values were successfully stored'),
            (err) => log.error(`Failed to store all values: ${err.stack}`)
        )
    }, WAIT_INTERVAL)
}

const errHandler = (err: Response<Error>) => {
    log.warn(err.statusCode, err.statusMessage, err.url, err.body)
}
