module.exports = function addCommand (name, fn) {
    var chainit = require('chainit');

    chainit.add(this, name, fn);
};