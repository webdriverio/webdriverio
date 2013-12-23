/**
 * protocol bindings for all cookie operations
 * @ref http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/cookie
 */

module.exports = function cookie (method, args, callback) {
    
    // set default options
    var data = {},
        requestOptions = {
            path: '/session/:sessionId/cookie',
            method: method.toUpperCase()
        };


    // set cookie param for POST method
    if(requestOptions.method === 'POST' && typeof args === 'object') {
        data.cookie = args;
    }

    // add cookie name tp path URL to delete a specific cookie object
    if(requestOptions.method === 'DELETE' && typeof args === 'string') {
        requestOptions.path += '/' + args;
    }

    // create request
    this.requestHandler.create(requestOptions,data,callback);

};