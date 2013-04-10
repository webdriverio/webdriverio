exports.command = function (script, args, callback) {

    var requestOptions = {
        path:"/session/:sessionId/execute",
        method:"POST"
    };

    if(!(args instanceof Array)) {
        args = [args];
    }

    this.requestHandler.create(requestOptions,{script: script, args: args},callback);

};

