module.exports = makeError;

function makeError(obj) {
    /* istanbul ignore next */
    if (!obj) {
        return null
    }

    var error = new Error();

    Object.keys(obj).forEach(function assign(propName) {
        error[propName] = obj[propName];
    });

    return error;
}