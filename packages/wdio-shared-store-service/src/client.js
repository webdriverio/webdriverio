import { post } from 'got'
import logger from '@wdio/logger'

const log = logger('@wdio/shared-store-service')

let baseUrl
export const setPort = (port) => { baseUrl = `http://localhost:${port}` }

/**
 * make a request to the server to get a value from the store
 * @param   {string} key
 * @returns {*}
 */
export const getValue = async (key) => {
    const res = await post(`${baseUrl}/get`, { json: { key }, responseType: 'json' }).catch(errHandler)
    return (res && res.body) ? res.body.value : undefined
}

/**
 * make a request to the server to set a value to the store
 * @param {string}  key
 * @param {*}       value `store[key]` value (plain object)
 */
export const setValue = async (key, value) => {
    await post(`${baseUrl}/set`, { json: { key, value } }).catch(errHandler)
}

const errHandler = err => {
    log.warn(err.statusCode, err.statusMessage, err.url, err.body)
}
