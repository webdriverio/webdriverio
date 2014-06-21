var cssValue = require('css-value'),
    rgb2hex  = require('rgb2hex');

module.exports = function parseCSS(response, cssProperty) {

    var parsedCSS = [];

    response.forEach(function(res) {
        parsedCSS.push(parse(res, cssProperty));
    });

    if(parsedCSS.length === 1) {
        parsedCSS = parsedCSS[0];
    } else if(parsedCSS.length === 0) {
        parsedCSS = null;
    }

    return parsedCSS;

};

var parse = function(cssPropertyValue, cssProperty) {

    if(!cssPropertyValue || !cssPropertyValue.value) {
        return null;
    }

    var parsedValue = {
            property: cssProperty,
            value: cssPropertyValue.value.toLowerCase().trim()
        };

    if(parsedValue.value.indexOf('rgb') === 0) {

        // remove whitespaces in rgb values
        parsedValue.value = parsedValue.value.replace(/\s/g,'');

        // parse color values
        var color = parsedValue.value;
        parsedValue.parsed = rgb2hex(parsedValue.value);
        parsedValue.parsed.type = 'color';
        parsedValue.parsed[/[rgba]+/g.exec(color)[0]] = color;

    } else if(parsedValue.property === 'font-family') {

        var font = cssValue(cssPropertyValue.value);
        var string = parsedValue.value;
        var value = cssPropertyValue.value.split(/,/).map(sanitize);

        parsedValue.value = sanitize(font[0].value || font[0].string);

        parsedValue.parsed = {
            value: value,
            type: 'font',
            string: string
        };

    } else {

        // parse other css properties
        try {
            parsedValue.parsed = cssValue(cssPropertyValue.value);

            if(parsedValue.parsed.length === 1) {
                parsedValue.parsed = parsedValue.parsed[0];
            }

            if(parsedValue.parsed.type && parsedValue.parsed.type === 'number' && parsedValue.parsed.unit === '') {
                parsedValue.value = parsedValue.parsed.value;
            }

        } catch(e) {
            // TODO improve css-parse lib to handle properties like
            // `-webkit-animation-timing-function :  cubic-bezier(0.25, 0.1, 0.25, 1)
        }

    }

    return parsedValue;

};

var sanitize = function(value) {

    if(!value) {
        return value;
    }

    return value.trim().replace(/'/g,'').replace(/"/g,'').toLowerCase();
};