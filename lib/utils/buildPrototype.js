module.exports = buildPrototype;

function buildPrototype(proto, dirs) {
    return dirs.reduce(extendProto, proto);
}

function extendProto(proto, dir) {
    var fs = require('fs');
    var realPath = require('./realPath.js');

    return fs
        .readdirSync(dir)
        .map(realPath(dir))
        .map(require)
        .reduce(findFunction, proto)
}

function findFunction(proto, fn) {
    proto[fn.name] = fn;
    return proto;
}