exports.command = function (script, args, callback) {

    var requestOptions = {
        path:"/session/:sessionId/execute_async",
        method:"POST"
    };

    if (typeof args === 'function') {
<<<<<<< HEAD
      callback = args;
      args = [];
=======
        callback = args;
        args = [];
>>>>>>> origin/v0.7.14
    }

    if(!(args instanceof Array)) {
        args = [args];
    }

    if (typeof script === 'function') {
<<<<<<< HEAD
      script = 'return (' + script + ').apply(null, arguments);';
=======
        script = 'return (' + script + ').apply(null, arguments);';
>>>>>>> origin/v0.7.14
    }

    this.requestHandler.create(requestOptions,{script: script, args: args},callback);

};

