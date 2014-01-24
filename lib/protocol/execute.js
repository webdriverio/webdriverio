module.exports = function execute (script, args, callback) {

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

    this.requestHandler.create(
        "/session/:sessionId/execute",
        {script: script, args: args},
        callback
    );

};

