let pkg = require('./web').default
if ('undefined' !== typeof process && void 0 !== process.release && 'node' === process.release.name) {
    pkg = require('./node').default
}

exports.default = pkg
