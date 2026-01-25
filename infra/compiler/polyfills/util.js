// Minimal util polyfill for browser
export const promisify = (fn) => (...args) => new Promise((resolve, reject) => {
    fn(...args, (err, result) => err ? reject(err) : resolve(result))
})

export const deprecate = (fn) => fn

export const inherits = (ctor, superCtor) => {
    if (ctor === undefined || ctor === null) {
        throw new TypeError('The "ctor" argument must be of type Function. Received ' + (ctor === null ? 'null' : typeof ctor))
    }
    if (typeof ctor !== 'function') {
        throw new TypeError('The "ctor" argument must be of type Function. Received type ' + typeof ctor)
    }
    if (superCtor === undefined || superCtor === null) {
        throw new TypeError('The "superCtor" argument must be of type Function. Received ' + (superCtor === null ? 'null' : typeof superCtor))
    }
    if (typeof superCtor !== 'function') {
        throw new TypeError('The "superCtor" argument must be of type Function. Received type ' + typeof superCtor)
    }
    if (superCtor.prototype === undefined) {
        throw new TypeError('The "superCtor.prototype" property must be defined')
    }
    ctor.super_ = superCtor
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype)
}

/**
 * Formats arguments like Node's util.format.
 * Supports %s (string), %d/%i (integer), %f (float), %j (JSON), %% (literal %)
 */
export const format = (...args) => {
    if (args.length === 0) {return ''}
    const first = args[0]

    // If first arg isn't a string, just stringify and join all args
    if (typeof first !== 'string') {
        return args.map(arg => typeof arg === 'object' ? safeStringify(arg) : String(arg)).join(' ')
    }

    // Parse format specifiers
    let argIndex = 1
    const result = first.replace(/%[sdifjoO%]/g, (match) => {
        if (match === '%%') {return '%'}
        if (argIndex >= args.length) {return match}

        const arg = args[argIndex++]
        switch (match) {
        case '%s': return String(arg)
        case '%d':
        case '%i': return Number.isNaN(Number(arg)) ? 'NaN' : String(parseInt(arg, 10))
        case '%f': return Number.isNaN(Number(arg)) ? 'NaN' : String(parseFloat(arg))
        case '%j': return safeStringify(arg)
        case '%o':
        case '%O': return inspect(arg)
        default: return match
        }
    })

    // Append any remaining args
    const remaining = args.slice(argIndex)
    if (remaining.length > 0) {
        return result + ' ' + remaining.map(arg =>
            typeof arg === 'object' ? inspect(arg) : String(arg)
        ).join(' ')
    }

    return result
}

/**
 * Safe JSON stringify that handles circular references
 */
const safeStringify = (obj) => {
    try {
        return JSON.stringify(obj)
    } catch {
        return inspect(obj)
    }
}

/**
 * Returns a string representation of an object.
 * Handles circular references using a WeakSet.
 */
export const inspect = (obj) => {
    const seen = new WeakSet()

    const stringify = (value, indent = '') => {
        if (value === null) {return 'null'}
        if (value === undefined) {return 'undefined'}
        if (typeof value === 'string') {return JSON.stringify(value)}
        if (typeof value === 'number' || typeof value === 'boolean') {return String(value)}
        if (typeof value === 'function') {return `[Function: ${value.name || 'anonymous'}]`}
        if (typeof value === 'symbol') {return value.toString()}
        if (typeof value === 'bigint') {return value.toString() + 'n'}

        if (typeof value === 'object') {
            if (seen.has(value)) {return '[Circular]'}
            seen.add(value)

            if (Array.isArray(value)) {
                if (value.length === 0) {return '[]'}
                const items = value.map(item => stringify(item, indent + '  '))
                return '[\n' + indent + '  ' + items.join(',\n' + indent + '  ') + '\n' + indent + ']'
            }

            if (value instanceof Date) {return value.toISOString()}
            if (value instanceof RegExp) {return value.toString()}
            if (value instanceof Error) {return `[${value.name}: ${value.message}]`}

            const keys = Object.keys(value)
            if (keys.length === 0) {return '{}'}
            const entries = keys.map(key => {
                const val = stringify(value[key], indent + '  ')
                return `${JSON.stringify(key)}: ${val}`
            })
            return '{\n' + indent + '  ' + entries.join(',\n' + indent + '  ') + '\n' + indent + '}'
        }

        return String(value)
    }

    return stringify(obj)
}

export default { promisify, deprecate, inherits, format, inspect }
