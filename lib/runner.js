var webdriverio = require('../'),
    client;

process.on('message', function(message) {

    switch(message.action) {
        case 'initiate': initiate(message.capabilities);
        break;
        case 'command': exec(message.commandId, message.fnName, message.args);
        break;
    }

});

var initiate = function(capabilities) {
    client = webdriverio.remote(capabilities);
};

var exec = function(commandId, fnName, args) {

    args.push(function() {
        var args = Array.prototype.slice.call(arguments);

        /**
         * kill process on end command
         */
        if(fnName === 'end') {
            process.kill(process.pid);
        }

        process.send({
            action: 'callback',
            args: args,
            commandId: commandId
        });

    });

    client[fnName].apply(client, args);
}