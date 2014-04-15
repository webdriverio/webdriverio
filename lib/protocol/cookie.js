/**
 * protocol bindings for all cookie operations
 * @ref http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/cookie
 */

module.exports = function cookie (method, args, callback) {
    
    // set default options
    var data = {},
        requestOptions = {
            path: '/session/:sessionId/cookie',
            method: typeof method == 'string' ? method : 'GET'
        };


    // set cookie param for POST method
    if(method === 'POST' && typeof args === 'object') {
        data.cookie = args;
    }

    // add cookie name tp path URL to delete a specific cookie object
    if(method === 'DELETE' && typeof args === 'string') {
        requestOptions.path += '/' + args;
    }

    // get cookie
    if(arguments.length === 1 && typeof method === 'function') {
        callback = method;
    }

    // create request
    this.requestHandler.create(requestOptions,data,callback);

};