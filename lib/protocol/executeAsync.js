exports.command = function (script, args, callback) {

    var requestOptions = {
        path:"/session/:sessionId/execute_async",
        method:"POST"
    };

    if (typeof args === 'function') {
        callback = args;
        args = [];
    }

    if(!(args instanceof Array)) {
        args = [args];
    }

    if (typeof script === 'function') {
        script = 'return (' + script + ').apply(null, arguments);';
    }

    this.requestHandler.create(requestOptions,{script: script, args: args},callback);

};

