exports.command = function(name, callback) {

    if(typeof name == 'function') {
        callback = name;
        name = null;
    }

    var requestOptions = {
        path: '/session/:sessionId/cookie' + (name ? '/:name' : ''),
        method: 'DELETE'
    };

    var self = this;

    if(name) {
        requestOptions.path = requestOptions.path.replace(/:name/, name);
    }

    this.requestHandler.create(requestOptions,{},callback);

};