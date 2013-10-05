var unicodeChars = require('../utils/unicodeChars');

exports.command = function (value, callback) {

    var requestOptions = {
        path:"/session/:sessionId/keys",
        method:"POST"
    };

    var key = [],
        data = {};

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
    console.log(data);

    this.requestHandler.create(requestOptions, data, callback);
};

/**
 * check for unicode character or split string into literals
 * @param  {String} value  text
 * @return {Array}         set of characters or unicode symbols
 */
function checkUnicode(value) {
    return unicodeChars.hasOwnProperty(value) ? [unicodeChars[value]] : value.split('');
}