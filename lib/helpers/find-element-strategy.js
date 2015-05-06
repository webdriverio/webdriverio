var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function findStrategy(args) {

    var callback = args[args.length - 1],
        value = args[0],
        using;

    if (typeof value !== 'string') {
        return callback(new ErrorHandler.ProtocolError('selector needs to be typeof `string`'));
    }

    if (args.length === 3) {
        return {
            using: args[0],
            value: args[1],
            callback: callback
        };
    }

    // check value type
    // use id strategy if value starts with # and doesnt contain any other CSS selector-relevant character
    if (value.indexOf('#') === 0 && value.search(/(\s|>|\.|\:|[|])/) === -1) {
        using = 'id';
        value = value.slice(1);

    // use xPath strategy if value starts with //
    } else if (value.indexOf('/') === 0 || value.indexOf('(') === 0 ||
               value.indexOf('../') === 0 || value.indexOf('./') === 0 ||
               value.indexOf('*/') === 0) {
        using = 'xpath';

    // use link text startegy if value startes with =
    } else if (value.indexOf('=') === 0) {
        using = 'link text';
        value = value.slice(1);

    // use partial link text startegy if value startes with *=
    } else if (value.indexOf('*=') === 0) {
        using = 'partial link text';
        value = value.slice(2);

    // use tag name strategy if value contains a tag
    // e.g. "<div>" or "<div />"
    } else if (value.search(/<[a-zA-Z\-]+( \/)*>/g) >= 0) {
        using = 'tag name';
        value = value.replace(/<|>|\/|\s/g, '');

    // use name strategy if value queries elements with name attributes
    // e.g. "[name='myName']" or '[name="myName"]'
    } else if (value.search(/^\[name=("|')([a-zA-z0-9\-_ ]+)("|')\]$/) >= 0) {
        using = 'name';
        value = value.match(/^\[name=("|')([a-zA-z0-9\-_ ]+)("|')\]$/)[2];

    // any element with given text e.g. h1=Welcome
    } else if (value.search(/^[a-z0-9]*=(.)+$/) >= 0) {
        var query = value.split(/=/),
            tag = query.shift();

        using = 'xpath';
        value = '//' + (tag.length ? tag : '*') + '[normalize-space() = "' + query.join('=') + '"]';

    // any element containing given text
    } else if (value.search(/^[a-z0-9]*\*=(.)+$/) >= 0) {
        var query = value.split(/\*=/),
            tag = query.shift();

        using = 'xpath';
        value = '//' + (tag.length ? tag : '*') + '[contains(., "' + query.join('*=') + '")]';

    // any element with certian class or id + given content
    } else if (value.search(/^[a-z0-9]*(\.|#)-?[_a-zA-Z]+[_a-zA-Z0-9-]*=(.)+$/) >= 0) {
        var query = value.split(/=/),
            tag = query.shift(),
            classOrId = tag.substr(tag.search(/(\.|#)/), 1) === '#' ? 'id' : 'class',
            classOrIdName = tag.slice(tag.search(/(\.|#)/) + 1);

        tag = tag.substr(0, tag.search(/(\.|#)/))
        using = 'xpath';
        value = '//' + (tag.length ? tag : '*') + '[contains(@' + classOrId + ', "' + classOrIdName + '") and normalize-space() = "' + query.join('=') + '"]';

    // any element with certian class or id + has certain content
    } else if (value.search(/^[a-z0-9]*(\.|#)-?[_a-zA-Z]+[_a-zA-Z0-9-]*\*=(.)+$/) >= 0) {
        var query = value.split(/\*=/),
            tag = query.shift(),
            classOrId = tag.substr(tag.search(/(\.|#)/), 1) === '#' ? 'id' : 'class',
            classOrIdName = tag.slice(tag.search(/(\.|#)/) + 1);

        tag = tag.substr(0, tag.search(/(\.|#)/))
        using = 'xpath';
        value = '//' + (tag.length ? tag : '*') + '[contains(@' + classOrId + ', "' + classOrIdName + '") and contains(., "' + query.join('*=') + '")]';

    // if nothing fits with the supported strategies we fall back to the css selector strategy
    } else {
        using = 'css selector';
    }

    return {
        using: using,
        value: value,
        callback: callback

    };
};
