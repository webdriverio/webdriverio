exports.command = function(name, callback) {

    if(typeof name == 'function') {
        callback = name;
        name = null;
    }

    var commandOptions = {
        path: '/session/:sessionId/cookie' + (name ? '/:name' : ''),
        method: 'DELETE'
    };

    var self = this;

    if(name) {
        commandOptions.path = commandOptions.path.replace(/:name/, name);
    }

    this.executeProtocolCommand(
        commandOptions,
        self.proxyResponseNoReturn(callback),
        {}
    );
};