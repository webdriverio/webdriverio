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
    this.runState = 0;
    this.origin = 'multibrowser';

    /**
     * create processes per instance
     */
    Object.keys(options).forEach(function(instanceName) {
        var instance = new Instance(instanceName, options[instanceName]);
        instance.on('message', onMessage.bind(self, instance));

        /**
         * set run state to running
         */
        self.runState |= instance.flag;

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
        this[name] = PromiseHandler(name, this.register(name, this[name]));

        /**
         * we still returns the instance so that we can continue chaining
         */
        return this;
    };

    this.startInstances = function(instances) {
        var self = this;

        if(!Array.isArray(instances)) {
            return this.runState;
        }

        instances.forEach(function(instanceName) {
            self.runState |= self.instances[instanceName].flag;
        });

        this.flushCommandQueue();

        return this.runState;
    };

    this.stopInstances = function(instances) {
        var self = this;

        if(!Array.isArray(instances)) {
            return this.runState;
        }

        instances.forEach(function(instanceName) {
            self.runState &= ~self.instances[instanceName].flag;
        });

        return this.runState;
    };

    this.flushCommandQueue = function() {
        var self = this;

        this.commandQueue.forEach(function(command) {
            for(instanceName in self.instances) {
                var instance = self.instances[instanceName];

                if(command.needsToGetExecutedBy & instance.flag) {
                    instance.send(command.message);
                }
            }
        });
    };

    /**
     * check if command was executed by all instances
     * by checking if bitmask only contains 1's
     */
    this.instancesAreSynced = function(commandId) {
        return parseInt(Array(Object.keys(this.instances).length + 1).join('1'), 2) === this.commandState[commandId].state;
    }

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

Multibrowser.register = function(fnName, chainedCommand) {
    /**
     * skip non selenium commands so they still get handled like
     * normal chained commands
     */
    if(nonSeleniumCommands.indexOf(fnName) === 0) {
        return chainedCommand;
    }

    /**
     * custom multibrowser call command
     * gets called onced given instances reach to that point (if no instances are given it will wait on all
     * created instances)
     *
     * @param  {Object[]}   instances  instances to wait
     * @param  {Function}   callback   function to be called
     * @type utility
     */
    if(fnName === 'call') {
        return function(instances, callback) {
            var self = this,
                commandId = this.commandState.length - 1;

            if(typeof instances === 'function') {
                callback = instances;
                instances = Object.keys(this.instances);
            }

            /**
             * stop instances
             */
            this.stopInstances(instances);

            this.eventHandler.on('multibrowser_' + commandId, function(finishedInstance, message) {
                /**
                 * check if instances are synced
                 */
                if(self.instancesAreSynced(commandId) || (instances.length !== Object.keys(self.instances).length)) {
                    /**
                     * start instances again
                     */
                    self.startInstances(instances);

                    /**
                     * execute callback
                     */
                    chainedCommand.call(this, callback);
                }
            });

            return this;
        }
    }

    return function() {
        var self = this,
            args = Array.prototype.slice.call(arguments),
            callback = args.pop(),
            missingInstances = 0;

        this.commandState.push({
            state: 0,
            value: {
                error: undefined,
                result: {},
                response: {}
            }
        });

        this.eventHandler.on(this.origin + '_' + (this.commandState.length - 1), function(instance, message) {
            chainedCommand.call(self, instance, message, callback);
        });

        var processMessage = {
            origin: this.origin,
            action: 'command',
            fnName: fnName,
            args: args,
            commandId: this.commandState.length - 1
        };

        for(var instanceName in this.instances) {
            var instance = this.instances[instanceName];

            /**
             * only send message if instance is running
             */
            if(this.runState & instance.flag) {
                instance.send(processMessage);
                continue;
            }

            missingInstances |= instance.flag;
        }

        /**
         * add commands to command loop if some instances aren't running
         */
        if(missingInstances) {
            this.commandQueue.push({
                needsToGetExecutedBy: missingInstances,
                message: processMessage
            });
        }

        return this;
    };
};

/**
 * assign custom multibrowser methods to each WebdriverIO command to make sure they'll get chained
 */
Object.keys(WebdriverIOPrototype.prototype).forEach(function(fnName) {
    /**
     * skip non selenium commands so they still get handled like
     * normal chained commands
     */
    if(!Multibrowser.prototype[fnName] && nonSeleniumCommands.indexOf(fnName) === 0) {
        return Multibrowser.prototype[fnName] = WebdriverIOPrototype.prototype[fnName];
    }

    /**
     * handle Selenium methods as real chained methods but instead of doing
     * HTTP requests we listen on the result from all instances.
     * Therefor is the actual multibrowser command just the event listener
     * and gets triggered once one intances finishes the command
     */
    Multibrowser.prototype[fnName] = function(instance, message, callback){
        var commandResult = this.commandState[message.commandId].value;
        commandResult.result[instance.name] = message.args[1];
        commandResult.response[instance.name] = message.args[2];

        /**
         * only set error if there actually was an error
         */
        if(message.args[0]) {
            commandResult.error[instance.name] = message.args[0];
        }

        /**
         * only execute callback and finish command once all instances finished
         * this command
         */
        if(!this.instancesAreSynced(message.commandId)) {
            return;
        }

        callback.call(this, commandResult.error, commandResult.result, commandResult.response);
    };
});

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

    this.commandState[message.commandId].state |= instance.flag;
    this.eventHandler.emit(message.origin + '_' + message.commandId, instance, message);
};

Multibrowser.prototype.call = WebdriverIOPrototype.prototype.__call;
module.exports = Multibrowser;