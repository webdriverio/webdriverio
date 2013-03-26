exports.command = function(cookieObj, callback) {

    if(typeof cookieObj === 'function') {
        callback = cookieObj;
        cookieObj = null;
    }

    var requestOptions = {
        path: '/session/:sessionId/cookie',
        method: cookieObj ? 'POST' : 'GET'
    };

    if(cookieObj && !('secure' in cookieObj)) {
        cookieObj.secure = false;
    }

    var data = cookieObj ? { cookie: cookieObj } : {};

    this.requestHandler.create(requestOptions,data,callback);

};