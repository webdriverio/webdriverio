var chainIt = require('chainit'),
    WebdriverIOPrototype = require('./webdriverio'),
    path = require('path'),
    cp = require('child_process'),
    commandState = [],
    callbackLoop = [];

function Multibrowser(options) {
    var self = this,
        instances = {};

    Object.keys(options).forEach(function(instanceName) {
        var instance = cp.fork(__dirname + path.sep + 'runner.js');
        instance.on('message', onMessage.bind(self, instance));
        instance.on('disconnect', onDisconnect.bind(self, instance));

        instance.send({
            action: 'initiate',
            capabilities: options[instanceName]
        });

        instances[instance.pid] = instance;
    });

    /**
     * assign WebdriverIO commands to Multibrowser
     */
    Object.keys(WebdriverIOPrototype.prototype).forEach(function(fnName) {
        /**
         * skip non selenium commands
         */
        if(fnName in ['call']) {
            return true;
        }

        Multibrowser.prototype[fnName] = emitCommand(fnName);
    });

    this.instances = instances;
};

var emitCommand = function(fnName) {
    return function() {
        var self = this,
            args = Array.prototype.slice.call(arguments),
            callback;

        commandState.push(0);

        /**
         * catch custom callback
         */
        if(typeof args[args.length - 1] === 'function') {
            callbackLoop[commandState.length - 1] = args.pop();
        }

        Object.keys(this.instances).forEach(function(pid) {
            self.instances[pid].send({
                action: 'command',
                fnName: fnName,
                args: args,
                commandId: commandState.length - 1
            });
        });

        return this;
    };
};

var onMessage = function(instance, message) {
    commandState[message.commandId]++;

    if(callbackLoop[message.commandId]) {
        callbackLoop[message.commandId].apply(this, message.args);
    }
}

var onDisconnect = function(instance, e) {
    instance.kill();
    delete this.instances[instance.pid];
};

Multibrowser.prototype.hasCommandFinished = function(commandId) {
    return commandState[commandId] === this.instances.length;
}

module.exports = Multibrowser;