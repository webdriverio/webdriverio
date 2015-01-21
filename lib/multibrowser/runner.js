var webdriverio = require('../../'),
    client;

process.on('message', function(message) {
    switch(message.action) {
        case 'initiate': initiate(message);
        break;
        case 'command': exec(message.origin, message.commandId, message.fnName, message.args);
        break;
        case 'kill': killProcess();
        break;
    }
});

var initiate = function(message) {
    client = webdriverio.remote(message.capabilities);

    /**
     * set flag that instance is running in multibrowser mode
     */
    client.inMultibrowserMode = true;
    client.instanceName = message.instanceName;

    /**
     * register events
     */
    client.on('end', emitEvent.bind(null, 'end'));
    client.on('init', emitEvent.bind(null, 'init'));
    client.on('error', emitEvent.bind(null, 'error'));
    client.on('command', emitEvent.bind(null, 'command'));
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
    };

    args.push(processCallback);
    client[fnName].apply(client, args);
};

var emitEvent = function() {
    var args = Array.prototype.slice.call(arguments),
        type = args.shift();

    process.send({
        action: 'event',
        origin: 'instance',
        instanceName: client.instanceName,
        type: type,
        args: args
    });
};

var killProcess = function() {
    return process.kill(process.pid);
};