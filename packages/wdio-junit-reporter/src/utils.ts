import stringify from 'json-stringify-safe'

const OBJLENGTH = 10
const ARRLENGTH = 10
const STRINGLIMIT = 1000
const STRINGTRUNCATE = 200

export const limit = function (rawVal?: any) {
    if (!rawVal) {
        return rawVal
    }

    // Ensure we're working with a copy
    let val = JSON.parse(stringify(rawVal))
    const type = Object.prototype.toString.call(val)

    if (type === '[object String]') {
        if (val.length > 100 && isBase64(val)) {
            return `[base64] ${val.length} bytes`
        }

        if (val.length > STRINGLIMIT) {
            return val.substr(0, STRINGTRUNCATE) + ` ... (${val.length - STRINGTRUNCATE} more bytes)`
        }

        return val
    } else if (type === '[object Array]') {
        const length = val.length
        if (length > ARRLENGTH) {
            val = val.slice(0, ARRLENGTH)
            val.push(`(${length - ARRLENGTH} more items)`)
        }
        return val.map(limit)
    } else if (type === '[object Object]') {
        const keys = Object.keys(val)
        const removed = []
        for (let i = 0, l = keys.length; i < l; i++) {
            if (i < OBJLENGTH) {
                val[keys[i]] = limit(val[keys[i]])
            } else {
                delete val[keys[i]]
                removed.push(keys[i])
            }
        }
        if (removed.length) {
            val._ = (keys.length - OBJLENGTH) + ' more keys: ' + JSON.stringify(removed)
        }
        return val
    }
    return val
}

/**
 * checks if provided string is Base64
 * @param {string} str string to check
 * @return {boolean} `true` if the provided string is Base64
 */
export function isBase64(str: string) {
    if (typeof str !== 'string') {
        throw new Error('Expected string but received invalid type.')
    }
    const len = str.length
    const notBase64 = /[^A-Z0-9+/=]/i
    if (!len || len % 4 !== 0 || notBase64.test(str)) {
        return false
    }
    const firstPaddingChar = str.indexOf('=')
    return (
        firstPaddingChar === -1 ||
        firstPaddingChar === len - 1 ||
        (firstPaddingChar === len - 2 && str[len - 1] === '=')
    )
}
