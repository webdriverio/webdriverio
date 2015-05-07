/**
 *
 */
module.exports = function (f, param) {
    return function() {
        var args = Array.prototype.slice.apply(param || arguments),
            result;

        try {
            result = f.apply(this, args);
        } catch(e) {
            return e;
        }

        return result;
    }
};
