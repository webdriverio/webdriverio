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
            const element = this
            return userDefinedCommand.apply(element, [
                function origCommandFunction() {
                    const context = this || element // respect explicite context binding, use element as default
                    return origCommand.apply(context, arguments)
                },
                ...args
            ])
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
        if (typeof arg === 'string' && (arg.startsWith('!function(') || arg.startsWith('return (function'))) {
            arg = '<fn>'
        } else if (typeof arg === 'string') {
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
 * checks if command argument is valid according to specificiation
 *
 * @param  {*}       arg           command argument
 * @param  {Object}  expectedType  parameter type (e.g. `number`, `string[]` or `(number|string)`)
 * @return {Boolean}               true if argument is valid
 */
export function isValidParameter (arg, expectedType) {
    let shouldBeArray = false

    if (expectedType.slice(-2) === '[]') {
        expectedType = expectedType.slice(0, -2)
        shouldBeArray = true
    }

    /**
     * check type of each individual array element
     */
    if (shouldBeArray) {
        if (!Array.isArray(arg)) {
            return false
        }
    } else {
        /**
         * transform to array to have a unified check
         */
        arg = [arg]
    }

    for (const argEntity of arg) {
        const argEntityType = getArgumentType(argEntity)
        if (!argEntityType.match(expectedType)) {
            return false
        }
    }

    return true
}

/**
 * get type of command argument
 */
export function getArgumentType (arg) {
    return arg === null ? 'null' : typeof arg
}

/**
 * Allows to safely require a package, it only throws if the package was found
 * but failed to load due to syntax errors
 * @param  {string} name  of package
 * @return {object}       package content
 */
export function safeRequire (name) {
    let requirePath
    try {
        /**
         * Check if cli command was called from local directory, if not require
         * the plugin from the place where the command is called. This avoids
         * issues where user have the @wdio/cli package installed globally
         * but run on a project where wdio packages are installed locally. It
         * also allows to link the package to a random place and have plugins
         * imported correctly (for dev purposes).
         */
        const localNodeModules = `${process.cwd()}/node_modules`
        /* istanbul ignore if */
        if (!require.main.paths.includes(localNodeModules)) {
            require.main.paths.push(localNodeModules)

            /**
             * don't set requireOpts when running unit tests as it
             * confuses Jest require magic
             */
            const requireOpts = process.env.JEST_WORKER_ID
                ? {}
                : { paths: require.main.paths }
            requirePath = require.resolve(name, requireOpts)
        } else {
            requirePath = require.resolve(name)
        }
    } catch (e) {
        return null
    }

    try {
        return require(requirePath)
    } catch (e) {
        throw new Error(`Couldn't initialise "${name}".\n${e.stack}`)
    }
}

/**
 * is function async
 * @param  {Function} fn  function to check
 * @return {Boolean}      true provided function is async
 */
export function isFunctionAsync (fn) {
    return (fn.constructor && fn.constructor.name === 'AsyncFunction') || fn.name === 'async'
}

/**
 * filter out arguments passed to specFn & hookFn, don't allow callbacks
 * as there is no need for user to call e.g. `done()`
 */
export function filterSpecArgs (args) {
    return args.filter((arg) => typeof arg !== 'function')
}
