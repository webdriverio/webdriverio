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
    if (typeof value === 'string') {

        requestOptions = commandOptionsPost;
        requestOptions.path = requestOptions.path.replace(/:id/gi, id);
        data = {'value': value.split('')};

        this.requestHandler.create(requestOptions, data, callback);

    } else {

        // get
        callback = value;
        requestOptions = commandOptionsGet;
        requestOptions.path = requestOptions.path.replace(/:id/gi, id);

        this.requestHandler.create(requestOptions, data, callback);
    }

};