import stringify from 'json-stringify-safe'
import validator from 'validator'

const OBJLENGTH = 10
const ARRLENGTH = 10
const STRINGLIMIT = 1000
const STRINGTRUNCATE = 200

let sanitizeString = function (str) {
    if (!str) {
        return ''
    }

    return String(str)
        .replace(/^.*\/([^\/]+)\/?$/, '$1')
        .replace(/\./g, '_')
        .replace(/\s/g, '')
        .toLowerCase()
}

/**
 * formats capability object into sanitized string for e.g.filenames
 * @param {Object} caps  Selenium capabilities
 */
let caps = function (caps) {
    let result

    /**
     * mobile caps
     */
    if (caps.deviceName) {
        result = [sanitizeString(caps.deviceName), sanitizeString(caps.platformName), sanitizeString(caps.platformVersion), sanitizeString(caps.app)]
    } else {
        result = [sanitizeString(caps.browserName), sanitizeString(caps.version), sanitizeString(caps.platform), sanitizeString(caps.app)]
    }

    result = result.filter(n => n !== undefined && n !== '')
    return result.join('.')
}

/**
 * formats arguments into string
 * @param  {Array} args arguments object
 */
let args = function (args) {
    return args.map((arg) => {
        if (typeof arg === 'function' || (typeof arg === 'string' && arg.indexOf('return (function') === 0)) {
            return '<Function>'
        } else if (typeof arg === 'string') {
            return '"' + arg + '"'
        } else if (Array.isArray(arg)) {
            return arg.join(', ')
        }

        return arg
    }).join(', ')
}

let css = function (value) {
    if (!value) {
        return value
    }

    return value.trim().replace(/'/g, '').replace(/"/g, '').toLowerCase()
}

/**
 * Limit the length of an arbitrary variable of any type, suitable for being logged or displayed
 * @param  {Any} val Any variable
 * @return {Any}     Limited var of same type
 */
let limit = function (val) {
    if (!val) return val

    // Ensure we're working with a copy
    val = JSON.parse(stringify(val))

    switch (Object.prototype.toString.call(val)) {
    case '[object String]':
        if (val.length > 100 && validator.isBase64(val)) {
            return '[base64] ' + val.length + ' bytes'
        }

        if (val.length > STRINGLIMIT) {
            return val.substr(0, STRINGTRUNCATE) + ' ... (' + (val.length - STRINGTRUNCATE) + ' more bytes)'
        }

        return val
    case '[object Array]':
        const length = val.length
        if (length > ARRLENGTH) {
            val = val.slice(0, ARRLENGTH)
            val.push('(' + (length - ARRLENGTH) + ' more items)')
        }
        return val.map(limit)
    case '[object Object]':
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

export default {
    css,
    args,
    caps,
    limit
}
