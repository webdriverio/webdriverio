/**
 * executes methods in try/catch block
 */
let safeExecute = function (f, param) {
    return function exec (...args) {
        let result
        args = param || args

        if (typeof f !== 'function') {
            return args[0]
        }

        /**
         * we need to catch errors here as we would stop the
         * execution and the promise (and the test) will never
         * finish
         */
        try {
            result = f.apply(this, args)
        } catch (e) {
            let error = e

            if (e instanceof Error === false) {
                error = new Error(e)
            }

            return error
        }

        return result
    }
}

export default safeExecute
