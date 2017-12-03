export default function WebDriver (sessionId, options, modifier) {
    const prototype = Object.create(Object.prototype)

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

        return client
    }

    unit.lift = function (name, func) {
        prototype[name] = function (...args) {
            const client = unit()
            return func.apply(client, args)
        }
    }

    return unit
}
