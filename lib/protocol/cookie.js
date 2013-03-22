exports.command = function(cookieObj, callback) {

    if(typeof cookieObj === 'function') {
        callback = cookieObj;
        cookieObj = null;
    }

    var commandOptions = {
        path: '/session/:sessionId/cookie',
        method: cookieObj ? 'POST' : 'GET'
    };

    if(cookieObj && !('secure' in cookieObj))
    {
        cookieObj.secure = false;
    }

    var data = cookieObj ? { cookie: cookieObj } : {};

    this.executeProtocolCommand(
        commandOptions,
        cookieObj ? this.proxyResponseNoReturn(callback) : this.proxyResponse(callback),
        data
    );
};