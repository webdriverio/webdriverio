var WebdriverIOPrototype = require('./webdriverio'),
    EventHandler = require('./utils/EventHandler'),
    path = require('path'),
    chainIt = require('chainit'),
    cp = require('child_process'),
    nonSeleniumCommands = ['__call', 'on','once','removeListener','removeAllListeners','emit'];

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

    /**
     * create processes per instance
     */
    Object.keys(options).forEach(function(instanceName) {
        var instance = cp.fork(__dirname + path.sep + 'runner.js');
        instance.on('message', onMessage.bind(self, instance));
        instance.on('disconnect', onDisconnect.bind(self, instance));

        /**
         * assign bitmask
         */
        flag *= 2;
        instance.flag = flag;
        instance.name = instanceName;

        /**
         * initialise process instance
         */
        instance.send({
            action: 'initiate',
            capabilities: options[instanceName]
        });

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

                if(command.bitmask & instance.flag) {
                    instance.send(command.message);
                }
            }
        });
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

            this.eventHandler.on('command_' + commandId, function(finishedInstance, message) {
                var instancesAreSynced = true;

                instances.forEach(function(instanceName) {
                    instancesAreSynced = instancesAreSynced && (self.commandState[commandId] & self.instances[instanceName].flag);
                });

                /**
                 * check if instances are synced
                 */
                if(instancesAreSynced || (instances.length !== Object.keys(self.instances).length)) {
                    /**
                     * start instances again
                     */
                    self.startInstances(instances);

                    /**
                     * execute callback
                     */
                    return chainedCommand.call(this, callback);
                }
            });

            return this;
        }
    }

    return function() {
        var self = this,
            args = Array.prototype.slice.call(arguments);

        this.commandState.push(0);
        chainedCommand.apply(this, [this.commandState.length - 1, args.pop()]);

        var processMessage = {
            action: 'command',
            fnName: fnName,
            args: args,
            commandId: this.commandState.length - 1
        };

        missingInstances = 0;
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
                bitmask: missingInstances,
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
     * HTTP requests we listen on the result from all instances
     */
    Multibrowser.prototype[fnName] = function(commandId, cb){
        this.eventHandler.on('command_' + commandId, function(instance, message) {
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
    this.commandState[message.commandId] |= instance.flag;
    this.eventHandler.emit('command_' + message.commandId, instance, message);
};

/**
 * process disconnect listener
 * gets called once an instance called the `end` method
 */
var onDisconnect = function(instance, e) {
    instance.kill();
    delete this.instances[instance.name];
};

Multibrowser.prototype.call = WebdriverIOPrototype.prototype.__call;
module.exports = Multibrowser;