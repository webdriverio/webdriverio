var unicodeChars = require('../utils/unicodeChars');

exports.command = function(id, value, callback) {

    var commandOptionsPost =  {
        path: '/session/:sessionId/element/:id/value',
        method: 'POST'
    };

    var commandOptionsGet =  {
        path: '/session/:sessionId/element/:id/value',
        method: 'GET'
    };

    var data = {},
        requestOptions = {};

    // set
    var key = [];
    if (typeof value === 'string') {

        requestOptions = commandOptionsPost;
        requestOptions.path = requestOptions.path.replace(/:id/gi, id);

        // replace key with corresponding unicode character
        if(unicodeChars.hasOwnProperty(value)) {
            key = [unicodeChars[value]];
        } else {
            key = value.split("");
        }

        data = {'value': key};

        this.requestHandler.create(requestOptions, data, callback);

    } else {

        // get
        callback = value;
        requestOptions = commandOptionsGet;
        requestOptions.path = requestOptions.path.replace(/:id/gi, id);

        this.requestHandler.create(requestOptions, data, callback);
    }

};