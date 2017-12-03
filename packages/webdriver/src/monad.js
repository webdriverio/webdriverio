export default function WebDriver (args, modifier) {
    const prototype = Object.create(Object.prototype)
    const options = {}

    /**
     * WebDriver monad
     */
    function unit () {
        let client = Object.create(prototype)

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
