var unicodeChars = require('../utils/unicodeChars');

module.exports = function elementIdValue (id, value, callback) {
    var path = '/session/:sessionId/element/:id/value';

    var data = {},
        key = [];

    path = path.replace(/:id/gi, id);

    if(typeof value === 'string') {

        // replace key with corresponding unicode character
        key = checkUnicode(value);

    } else if(value instanceof Array) {

        value.forEach(function(charSet,i) {
            key = key.concat(checkUnicode(charSet));
        });

    } else {
        // TODO throw error
        // ignore values from type object
        key = [];
    }

    data = {'value': key};

    this.requestHandler.create(path, data, callback);

};

/**
 * check for unicode character or split string into literals
 * @param  {String} value  text
 * @return {Array}         set of characters or unicode symbols
 */
function checkUnicode(value) {
    return unicodeChars.hasOwnProperty(value) ? [unicodeChars[value]] : value.split('');
}