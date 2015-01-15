var webdriverio = require('../../'),
    client;

process.on('message', function(message) {
    switch(message.action) {
        case 'initiate': initiate(message.capabilities);
        break;
        case 'command': exec(message.origin, message.commandId, message.fnName, message.args);
        break;
    }
});

var initiate = function(capabilities) {
    client = webdriverio.remote(capabilities);

    /**
     * set flag that instance is running in multibrowser mode
     */
    client.inMultibrowserMode = true;
};

var exec = function(origin, commandId, fnName, args) {
    var processCallback = function() {
        var args = Array.prototype.slice.call(arguments);

        process.send({
            origin: origin,
            action: 'callback',
            fnName: fnName,
            args: args,
            commandId: commandId
        });

        /*
         * kill process on end command
         */
        if(fnName === 'end') {
            return process.kill(process.pid);
        }
    }

    args.push(processCallback);
    client[fnName].apply(client, args);
};