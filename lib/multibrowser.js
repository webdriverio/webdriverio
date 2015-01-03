var WebdriverIOPrototype = require('./webdriverio'),
    EventHandler = require('./utils/EventHandler'),
    path = require('path'),
    chainIt = require('chainit'),
    cp = require('child_process'),
    nonSeleniumCommands = ['call','on','once','removeListener','removeAllListeners','emit'],
    commandState = [],
    callbackLoop = [];

/**
 * Constructor
 */
function Multibrowser(options) {
    var self = this,
        instances = {};

    /**
     * create processes per instance
     */
    Object.keys(options).forEach(function(instanceName) {
        var instance = cp.fork(__dirname + path.sep + 'runner.js');
        instance.on('message', onMessage.bind(self, instance));
        instance.on('disconnect', onDisconnect.bind(self, instance));

        /**
         * initialise process instance
         */
        instance.send({
            action: 'initiate',
            capabilities: options[instanceName]
        });

        instances[instance.pid] = instance;
    });

    this.eventHandler = new EventHandler(this);
    this.instances = instances;

    /**
     * addCommand added here because it's synchronous and thus does not need
     * to be added to asynchronous chain.
     */
    this.addCommand = function(name, fn) {
        chainIt.add(this, name, fn);

        /**
         * promisify new commands
         */
        this[name] = PromiseHandler(name, this.register(name, this[name]));

        /**
         * we still returns the instance so that we can continue chaining
         */
        return this;
    };
};

Multibrowser.register = function(fnName, chainedCommand) {
    /**
     * skip non selenium commands so they still get handled like
     * normal chained commands
     */
    if(nonSeleniumCommands.indexOf(fnName) === 0) {
        return chainedCommand;
    }

    return function() {
        var self = this,
            args = Array.prototype.slice.call(arguments);

        commandState.push(0);
        chainedCommand.apply(this, [commandState.length - 1, args.pop()]);

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

/**
 * assign noops methods to each WebdriverIO command to make sure they'll get chained
 */
Object.keys(WebdriverIOPrototype.prototype).forEach(function(fnName) {
    /**
     * skip non selenium commands so they still get handled like
     * normal chained commands
     */
    if(nonSeleniumCommands.indexOf(fnName) === 0) {
        return Multibrowser.prototype[fnName] = WebdriverIOPrototype.prototype[fnName];
    }

    /**
     * handle Selenium methods as real chained methods but instead of doing
     * HTTP requests we listen on the result from all instances
     */
    Multibrowser.prototype[fnName] = function(commandId, cb){
        this.eventHandler.on(fnName + '_response', function(instance, message) {
            /**
             * make sure that we call the callback method of
             * the correct commandId
             */
            if(commandId !== message.commandId) {
                return;
            }

            cb.apply(this, message.args);
        });
    };
});

/**
 * process message listener
 * gets called once an instance finishes a command
 */
var onMessage = function(instance, message) {
    commandState[message.commandId]++;
    this.eventHandler.emit(message.fnName + '_response', instance, message);
};

/**
 * process disconnect listener
 * gets called once an instance called the `end` method
 */
var onDisconnect = function(instance, e) {
    instance.kill();
    delete this.instances[instance.pid];
};

module.exports = Multibrowser;