/**
 *
 */
module.exports = function (f, param) {
    return function() {
        var args = Array.prototype.slice.apply(param || arguments),
            result, callback;

        /**
         * type check
         */
        f = typeof f === 'function' ? f : function() {};
        try {
            result = f.apply(this, args);
        } catch(e) {
            return e;
        }

        return result;
    }
};
