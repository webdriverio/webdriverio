var WebdriverIOPrototype = require('./webdriverio'),
    EventHandler = require('./utils/EventHandler'),
    ErrorHandler = require('./utils/ErrorHandler'),
    Instance = require('./multibrowser/Instance'),
    nonSeleniumCommands = require('./multibrowser/static').nonSeleniumCommands;

/**
 * Constructor
 */
function Multibrowser(options) {
    var self = this,
        instances = {},
        flag = 0.5;

    this.commandState = [];
    this.commandQueue = [];
    this.origin = 'multibrowser';

    /**
     * create processes per instance
     */
    Object.keys(options).forEach(function(instanceName) {
        var instance = new Instance(instanceName, options[instanceName]);
        instance.cp.on('message', onMessage.bind(self, instance));
        instances[instanceName] = instance;
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
        this[name] = PromiseHandler(name, this[name]);

        /**
         * we still returns the instance so that we can continue chaining
         */
        return this;
    };

    /**
     * helper for getting single browser instance
     */
    this.select = function(instanceName) {
        if(typeof instanceName !== 'string' || !this.instances[instanceName]) {
            throw ErrorHandler.CommandError('instance "' + instanceName.toString() + '" does not exist! You\'ve defined the following instances: ' + Object.keys(this.instances));
        }

        return this.instances[instanceName];
    }
};

/**
 * assign custom multibrowser methods to each WebdriverIO command to make sure they'll get chained
 */
Object.keys(WebdriverIOPrototype.prototype).forEach(function(fnName) {
    /**
     * skip non selenium commands so they still get handled like
     * normal chained commands
     */
    if(!Multibrowser.prototype[fnName] && nonSeleniumCommands.indexOf(fnName) > -1) {
        return Multibrowser.prototype[fnName] = WebdriverIOPrototype.prototype[fnName];
    }

    /**
     * handle Selenium methods as real chained methods but instead of doing
     * HTTP requests we listen on the result from all instances.
     * Therefor is the actual multibrowser command just the event listener
     * and gets triggered once one intances finishes the command
     */
    Multibrowser.prototype[fnName] = function() {

        var self = this,
            args = Array.prototype.slice.call(arguments),
            callback = args.pop(),
            instanceName;

        /**
         * cast all function parameters into strings to send them to the instance child_process
         */
        for(var i in args) {
            args[i] = typeof args[i] === 'function' ? args[i].toString() : args[i];
        }

        this.commandState.push({
            error: {},
            result: {},
            response: {}
        });

        var processMessage = {
            origin: this.origin,
            action: 'command',
            fnName: fnName,
            args: args,
            commandId: this.commandState.length - 1
        };

        /**
         * execute command with all instances
         */
        for(instanceName in this.instances) {
            this.instances[instanceName].cp.send(processMessage);
        }

        /**
         * listen on when command finishes and call callback to go to the next command
         */
        this.eventHandler.on(this.origin + '_' + (this.commandState.length - 1), finishCommand.bind(this, callback));

    }
});

/**
 * gets called once an instance finishes a command
 */
var finishCommand = function(callback, instance, message){

    var commandResult = this.commandState[message.commandId];
    commandResult.result[instance.name] = message.args[1];
    commandResult.response[instance.name] = message.args[2];

    /**
     * kill child processes on end
     */
    if(message.fnName === 'end') {
        for(instanceName in this.instances) {
            this.instances[instanceName].cp.send({ action: 'kill' });
        }
    }

    /**
     * only set error if there actually was an error
     */
    if(message.args[0]) {
        commandResult.error[instance.name] = message.args[0];
    }

    /**
     * only execute callback and finish command once all instances have finished this command
     */
    if(Object.keys(commandResult.result).length !== Object.keys(this.instances).length) {
        return;
    }

    /**
     * set error parameter to undefined if no instance reported an issue
     */
    if(Object.keys(commandResult.error).length === 0) {
        commandResult.error = undefined;
    }

    callback.call(this, commandResult.error, commandResult.result, commandResult.response);

};

/**
 * process message listener
 * gets called once an instance finishes a command
 */
var onMessage = function(instance, message) {

    /**
     * only handle messages executed by multibrowser
     */
    if(message.origin !== this.origin) {
        return;
    }

    /**
     * emit that instance has finished the command
     */
    this.eventHandler.emit(message.origin + '_' + message.commandId, instance, message);

};

module.exports = Multibrowser;