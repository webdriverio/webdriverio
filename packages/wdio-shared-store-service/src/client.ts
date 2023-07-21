import type { RequestError } from 'got'
import got from 'got'

import type { JsonCompatible, JsonPrimitive, JsonObject, JsonArray } from '@wdio/types'
import type { GetValueOptions } from './types'

let baseUrlResolve: Parameters<ConstructorParameters<typeof Promise>[0]>[0]
const baseUrlPromise = new Promise<string>((resolve) => {
    baseUrlResolve = resolve
})

let isBaseUrlReady = false
export const setPort = (port: number) => {
    /**
     * if someone calls `setValue` in `onPrepare` we don't have a base url
     * set as the launcher is called after user hooks. In this case we need
     * to wait until it is set and flush all messages.
     */
    baseUrlResolve(`http://localhost:${port}`)
    isBaseUrlReady = true
}

/**
 * make a request to the server to get a value from the store
 * @param   {string} key
 * @returns {*}
 */
export const getValue = async (key: string): Promise<string | number | boolean | JsonObject | JsonArray | null | undefined> => {
    const baseUrl = await baseUrlPromise
    const res = await got.get(`${baseUrl}/${key}`, { responseType: 'json' }).catch(errHandler)
    return res?.body ? (res.body as JsonObject).value : undefined
}

/**
 * make a request to the server to set a value to the store
 * @param {string}  key
 * @param {*}       value `store[key]` value (plain object)
 */
export const setValue = async (key: string, value: JsonCompatible | JsonPrimitive) => {
    const setPromise = baseUrlPromise.then((baseUrl) => {
        return got.post(`${baseUrl}/`, { json: { key, value } }).catch(errHandler)
    })

    return isBaseUrlReady ? setPromise : Promise.resolve()
}

/**
 *
 * @param {string}  key
 * @param {*}       value
 */
export const setResourcePool = async (key: string, value: JsonArray) => {
    const setPromise = baseUrlPromise.then((baseUrl) => {
        return got.post(`${baseUrl}/pool`, { json: { key, value } }).catch(errHandler)
    })

    return isBaseUrlReady ? setPromise : Promise.resolve()
}

/**
 *
 * @param {string}  key
 * @param {*}       value
 */
export const getValueFromPool = async (key: string, options?: GetValueOptions) => {
    const baseUrl = await baseUrlPromise
    const res = await got.get(`${baseUrl}/pool/${key}${typeof options?.timeout === 'number' ? `?timeout=${options.timeout}` : '' }`, { responseType: 'json' }).catch(errHandler)
    return res?.body ? (res.body as JsonObject).value : undefined
}

/**
 *
 * @param {string}  key
 * @param {*}       value
 */
export const addValueToPool = async (key: string, value: JsonPrimitive | JsonCompatible) => {
    const baseUrl = await baseUrlPromise
    const res = await got.post(`${baseUrl}/pool/${key}`, { json: { value }, responseType: 'json' }).catch(errHandler)
    return res?.body ? (res.body as JsonObject).value : undefined
}

const errHandler = (err: RequestError) => {
    throw new Error(`${err.response?.body || 'Shared store server threw an error'}`)
}
