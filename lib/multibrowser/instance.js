var webdriverio = require('../webdriverio'),
    child_process = require('child_process'),
    EventHandler = require('../utils/EventHandler'),
    nonSeleniumCommands = require('./static').nonSeleniumCommands,
    path = require('path'),
    flag = 0.5;

/**
 * Instance instance
 */
function Instance(instanceName, capabilities) {
    /**
     * assign bitmask
     */
    flag *= 2;
    this.flag = flag;
    this.name = instanceName;

    this.commandId = 0;
    this.eventHandler = new EventHandler(this);

    /**
     * process disconnect listener
     * gets called once an instance called the `end` method
     */
    this.onDisconnect = function(e) {
        this.cp.kill();
    };

    this.onMessage = function(message) {
        this.eventHandler.emit(message.origin + '_' + message.commandId, message);
    };

    this.cp = child_process.fork(__dirname + path.sep + 'runner.js');
    this.cp.on('disconnect', this.onDisconnect.bind(this));
    this.cp.on('message', this.onMessage.bind(this));

    /**
     * populate child process methods
     */
    this.send = this.cp.send.bind(this.cp);
    this.on = this.cp.on.bind(this.cp);

    /**
     * initialise process instance
     */
    this.cp.send({
        action: 'initiate',
        capabilities: capabilities
    });
};

/**
 * assign custom instance methods to each WebdriverIO command to make sure they'll get chained
 */
Object.keys(webdriverio.prototype).forEach(function(fnName) {
    /**
     * skip non selenium commands so they still get handled like
     * normal chained commands
     */
    if(nonSeleniumCommands.indexOf(fnName) === 0) {
        return Instance.prototype[fnName] = webdriverio.prototype[fnName];
    }

    /**
     * handle Selenium methods as real chained methods but instead of doing
     * HTTP requests we listen on the result from all instances.
     * Therefor is the actual Instance command just the event listener
     * and gets triggered once one intances finishes the command
     */
    Instance.prototype[fnName] = function(){
        var self = this,
            origin = 'instance',
            args = Array.prototype.slice.call(arguments),
            callback;

        if(typeof args[args.length - 1] === 'function') {
            callback = args.pop();
        }

        var processMessage = {
            origin: origin,
            action: 'command',
            fnName: fnName,
            args: args,
            commandId: this.commandId
        };

        this.send(processMessage);
        this.eventHandler.emit('instance_command', this.commandId);

        if(callback) {
            this.eventHandler.once(origin + '_' + this.commandId, function(message) {
                return callback.apply(self, message.args);
            });
        }

        this.commandId++;

        return this;
    };
});

module.exports = Instance;