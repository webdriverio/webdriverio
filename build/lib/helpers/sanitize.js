'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _jsonStringifySafe = require('json-stringify-safe');

var _jsonStringifySafe2 = _interopRequireDefault(_jsonStringifySafe);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var OBJLENGTH = 10;
var ARRLENGTH = 10;
var STRINGLIMIT = 1000;
var STRINGTRUNCATE = 200;

var sanitizeString = function sanitizeString(str) {
    if (!str) {
        return '';
    }

    return String(str).replace(/^.*\/([^\/]+)\/?$/, '$1').replace(/\./g, '_').replace(/\s/g, '').toLowerCase();
};

/**
 * formats capability object into sanitized string for e.g.filenames
 * @param {Object} caps  Selenium capabilities
 */
var caps = function caps(_caps) {
    var result = undefined;

    /**
     * mobile caps
     */
    if (_caps.deviceName) {
        result = [sanitizeString(_caps.deviceName), sanitizeString(_caps.platformName), sanitizeString(_caps.platformVersion), sanitizeString(_caps.app)];
    } else {
        result = [sanitizeString(_caps.browserName), sanitizeString(_caps.version), sanitizeString(_caps.platform), sanitizeString(_caps.app)];
    }

    result = result.filter(function (n) {
        return n !== undefined && n !== '';
    });
    return result.join('.');
};

/**
 * formats arguments into string
 * @param  {Array} args arguments object
 */
var args = function args(_args) {
    return _args.map(function (arg) {
        if (typeof arg === 'function' || typeof arg === 'string' && arg.indexOf('return (function') === 0) {
            return '<Function>';
        } else if (typeof arg === 'string') {
            return '"' + arg + '"';
        } else if (Array.isArray(arg)) {
            return arg.join(', ');
        }

        return arg;
    }).join(', ');
};

var css = function css(value) {
    if (!value) {
        return value;
    }

    return value.trim().replace(/'/g, '').replace(/"/g, '').toLowerCase();
};

/**
 * Limit the length of an arbitrary variable of any type, suitable for being logged or displayed
 * @param  {Any} val Any variable
 * @return {Any}     Limited var of same type
 */
var limit = function limit(val) {
    if (!val) return val;

    // Ensure we're working with a copy
    val = JSON.parse((0, _jsonStringifySafe2['default'])(val));

    switch (Object.prototype.toString.call(val)) {
        case '[object String]':
            if (val.length > 100 && _validator2['default'].isBase64(val)) {
                return '[base64] ' + val.length + ' bytes';
            }

            if (val.length > STRINGLIMIT) {
                return val.substr(0, STRINGTRUNCATE) + ' ... (' + (val.length - STRINGTRUNCATE) + ' more bytes)';
            }

            return val;
        case '[object Array]':
            var length = val.length;
            if (length > ARRLENGTH) {
                val = val.slice(0, ARRLENGTH);
                val.push('(' + (length - ARRLENGTH) + ' more items)');
            }
            return val.map(limit);
        case '[object Object]':
            var keys = _Object$keys(val);
            var removed = [];
            for (var i = 0, l = keys.length; i < l; i++) {
                if (i < OBJLENGTH) {
                    val[keys[i]] = limit(val[keys[i]]);
                } else {
                    delete val[keys[i]];
                    removed.push(keys[i]);
                }
            }
            if (removed.length) {
                val._ = keys.length - OBJLENGTH + ' more keys: ' + JSON.stringify(removed);
            }
            return val;
    }
    return val;
};

exports['default'] = {
    css: css,
    args: args,
    caps: caps,
    limit: limit
};
module.exports = exports['default'];
