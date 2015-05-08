/**
 *
 */
module.exports = function (f, param) {
    return function safeExecute() {
        var args = Array.prototype.slice.apply(param || arguments),
            result;

        if(typeof f !== 'function') {
            return args[0];
        }

        /**
         * we need to catch errors here as we would stop the
         * execution and the promise (and the test) will never
         * finish
         */
        try {
            result = f.apply(this, args);
        } catch(e) {
            return e;
        }

        return result;
    };
};
