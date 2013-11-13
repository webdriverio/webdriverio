module.exports = buildPrototype;

function buildPrototype(proto, dirs) {
    return dirs.reduce(extendProto, proto);
}

function extendProto(dir, proto) {
    var fs = require('fs');

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

function realPath(dir) {
    var path = require('path');

    return function(file) {
        return path.join(dir, file)
    }
}