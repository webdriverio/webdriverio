import logger from 'wdio-logger'

export default function WebDriver (sessionId, options, modifier) {
    const prototype = Object.create(Object.prototype)
    const log = logger('webdriver')

    /**
     * WebDriver monad
     */
    function unit () {
        let client = Object.create(prototype)
        client.options = options
        client.sessionId = sessionId

        if (typeof modifier === 'function') {
            client = modifier(client, options)
        }

        client.addCommand = function (name, func) {
            unit.lift(name, func)
        }

        return client
    }

    unit.lift = function (name, func) {
        prototype[name] = function (...args) {
            const client = unit()
            log.info('COMMAND', `${name}(${args.join(', ')})`)
            return func.apply(client, args)
        }
    }

    return unit
}
