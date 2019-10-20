import { post } from 'axios'

let baseUrl
export const setPort = (port) => { baseUrl = `http://localhost:${port}` }

/**
 * make a request to the server to get a value from the store
 * @param   {string} key
 * @returns {*}
 */
export const getValue = async (key) => {
    const res = await post(`${baseUrl}/get`, { key }).catch(errHandler)
    return res.data ? res.data.value : undefined
}

/**
 * make a request to the server to set a value to the store
 * @param {string}  key
 * @param {*}       value `store[key]` value (plain object)
 */
export const setValue = async (key, value) => {
    await post(`${baseUrl}/set`, { key, value }).catch(errHandler)
}

const errHandler = () => { }
