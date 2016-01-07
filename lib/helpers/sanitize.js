let sanitizeString = function (str) {
    if (!str) {
        return ''
    }

    return String(str)
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
        result = [sanitizeString(caps.browserName), sanitizeString(caps.version), sanitizeString(caps.platform)]
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

export default {
    css,
    args,
    caps
}
