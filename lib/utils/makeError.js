module.exports = makeError;

function makeError(obj) {
    if (!obj) {
        return null
    }

    var error = new Error();

    Object.keys(obj).forEach(function assign(propName) {
        error[propName] = obj[propName];
    });

    return error;
}