module.exports = function realPath(base) {
    var path = require('path');

    return function(file) {
        return path.join(base, file);
    }
}