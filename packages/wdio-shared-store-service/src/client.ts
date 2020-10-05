import got, { Response } from 'got'
import logger from '@wdio/logger'

const log = logger('@wdio/shared-store-service')

let baseUrl: string
export const setPort = (port: string) => { baseUrl = `http://localhost:${port}` }

/**
 * make a request to the server to get a value from the store
 * @param   {string} key
 * @returns {*}
 */
export const getValue = async (key: string) => {
    const res = await got.post(`${baseUrl}/get`, { json: { key }, responseType: 'json' }).catch(errHandler)
    return (res && res.body) ? (res.body as WebdriverIO.JsonObject).value : undefined
}

/**
 * make a request to the server to set a value to the store
 * @param {string}  key
 * @param {*}       value `store[key]` value (plain object)
 */
export const setValue = async (key: string, value: WebdriverIO.JsonCompatible | WebdriverIO.JsonPrimitive) => {
    await got.post(`${baseUrl}/set`, { json: { key, value } }).catch(errHandler)
}

const errHandler = (err: Response<Error>) => {
    log.warn(err.statusCode, err.statusMessage, err.url, err.body)
}
