'use strict';

function sanitize(str) {

    if(!str) return '';

    return String(str)
        .replace(/\./g, '_')
        .replace(/\s/g, '')
        .toLowerCase();
}

/**
 * formats capability object into sanitized string for e.g.filenames
 * @param {Object} caps  Selenium capabilities
 */
exports.caps = function(caps) {
    var result;

    /**
     * mobile caps
     */
    if(caps.deviceName) {
        result = [sanitize(caps.deviceName), sanitize(caps.platformName), sanitize(caps.platformVersion)];
    } else {
        result = [sanitize(caps.browserName), sanitize(caps.version), sanitize(caps.platform)];
    }

    result = result.filter(function(n){
        return n !== undefined && n !== '';
    });
    return result.join('.');
};

/**
 * formats arguments into string
 * @param  {Array} args arguments object
 */
exports.args = function(args) {
    return args.map(function(arg) {
        if(typeof arg === 'function' || (typeof arg === 'string' && arg.indexOf('return (function') === 0)) {
            return '<Function>';
        } else if(typeof arg === 'string') {
            return '"' + arg + '"';
        } else if(Array.isArray(arg)) {
            return arg.join(', ');
        }
        return  arg;
    }).join(', ');
};