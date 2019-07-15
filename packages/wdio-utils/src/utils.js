/**
 * overwrite native element commands with user defined
 * @param {object} propertiesObject propertiesObject
 */
export function overwriteElementCommands(propertiesObject) {
    const elementOverrides = propertiesObject['__elementOverrides__'] ? propertiesObject['__elementOverrides__'].value : {}

    for (const [commandName, userDefinedCommand] of Object.entries(elementOverrides)) {
        if (typeof userDefinedCommand !== 'function') {
            throw new Error('overwriteCommand: commands be overwritten only with functions, command: ' + commandName)
        }

        if (!propertiesObject[commandName]) {
            throw new Error('overwriteCommand: no command to be overwritten: ' + commandName)
        }

        if (typeof propertiesObject[commandName].value !== 'function') {
            throw new Error('overwriteCommand: only functions can be overwritten, command: ' + commandName)
        }

        const origCommand = propertiesObject[commandName].value
        delete propertiesObject[commandName]

        const newCommand = function (...args) {
            return userDefinedCommand.apply(this, [origCommand.bind(this), ...args])
        }

        propertiesObject[commandName] = {
            value: newCommand,
            configurable: true
        }
    }

    delete propertiesObject['__elementOverrides__']
    propertiesObject['__elementOverrides__'] = { value: {} }
}

/**
 * get command call structure
 * (for logging purposes)
 */
export function commandCallStructure (commandName, args) {
    const callArgs = args.map((arg) => {
        if (typeof arg === 'string') {
            arg = `"${arg}"`
        } else if (typeof arg === 'function') {
            arg = '<fn>'
        } else if (arg === null) {
            arg = 'null'
        } else if (typeof arg === 'object') {
            arg = '<object>'
        } else if (typeof arg === 'undefined') {
            arg = typeof arg
        }

        return arg
    }).join(', ')

    return `${commandName}(${callArgs})`
}

/**
 * is function async
 * @param {Function} fn
 */
export function isFunctionAsync (fn) {
    return (fn.constructor && fn.constructor.name === 'AsyncFunction') || fn.name === 'async'
}
