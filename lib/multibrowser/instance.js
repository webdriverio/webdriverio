var webdriverio = require('../webdriverio'),
    child_process = require('child_process'),
    EventHandler = require('../utils/EventHandler'),
    PromiseHandler = require('../utils/PromiseHandler'),
    nonSeleniumCommands = require('./static').nonSeleniumCommands,
    chainIt = require('chainit'),
    path = require('path');

/**
 * Instance instance
 */
function Instance(instanceName, capabilities, multibrowserInstance) {
    /**
     * assign bitmask
     */
    this.name = instanceName;
    this.origin = 'instance';
    this.multibrowserInstance = multibrowserInstance;
    this.eventHandler = new EventHandler(this);

    /**
     * register listener for error to avoid breaking tests if no listener is registered
     */
    this.eventHandler.on('error', function(){});

    /**
     * process disconnect listener
     * gets called once an instance called the `end` method
     */
    this.onDisconnect = function(e) {
        /**
         * ToDo handle disconnects
         */
        // this.cp.kill();
    };

    this.onError = function(err) {
        /**
         * ToDo handle errors
         */
    };

    this.onMessage = function(message) {
        /**
         * handling events
         */
        if(message.action === 'event') {
            message.args.unshift(message.type);
            message.args.push(message.instanceName);
            return this.eventHandler.emit.apply(this.eventHandler, message.args);
        }

        /**
         * acknowledge end command
         */
        if(message.action === 'command' && message.fnName === 'end') {
            this.cp.send({ action: 'kill' });
        }
    };

    /**
     * addCommand added here because it's synchronous and thus does not need
     * to be added to asynchronous chain.
     */
    this.addCommand = function(name, fn) {
        var self = this,
            newCommand = '_instance_' + name;

        this.multibrowserInstance.addCommand(newCommand, fn.bind(this));
        this[name] = function(){
            var args = Array.prototype.slice.call(arguments);
            self.multibrowserInstance[newCommand].apply(self, args);
            return this;
        };
        this[name] = PromiseHandler(name, this[name]);

        /**
         * we still returns the instance so that we can continue chaining
         */
        return this;
    };

    this.cp = child_process.fork(__dirname + path.sep + 'runner.js');
    this.cp.on('disconnect', this.onDisconnect.bind(this));
    this.cp.on('message', this.onMessage.bind(this));
    this.cp.on('error', this.onError.bind(this));

    /**
     * initialise process instance
     */
    this.cp.send({
        action: 'initiate',
        instanceName: this.name,
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
    if(!Instance.prototype[fnName] && nonSeleniumCommands.indexOf(fnName) > -1) {
        Instance.prototype[fnName] = function(a) {
            var args = Array.prototype.slice.call(arguments);
            this.multibrowserInstance[fnName](a);
            return this;
        }
        return;
    }

    /**
     * handle Selenium methods as real chained methods but instead of doing
     * HTTP requests we listen on the result from all instances.
     * Therefor is the actual Instance command just the event listener
     * and gets triggered once one intances finishes the command
     */
    Instance.prototype[fnName] = function(){
        var self = this,
            args = Array.prototype.slice.call(arguments),
            callback = undefined;

        if(typeof arguments[arguments.length - 1] === 'function' && (!fnName.match(/execute/i) || args.length > 1)) {
            callback = args.pop();
        }

        /**
         * cast all function parameters into strings to send them to the instance child_process
         */
        for(var i in args) {
            args[i] = typeof args[i] === 'function' ? args[i].toString() : args[i];
        }

        this.multibrowserInstance.instanceCommand(this.name, {
            origin: this.origin,
            action: 'command',
            fnName: fnName,
            args: args
        }, callback);

        return this;
    };
});

/**
 * promisify commands
 */
Object.keys(Instance.prototype).forEach(function(fnName) {
    Instance.prototype[fnName] = PromiseHandler(fnName, Instance.prototype[fnName]);
});

module.exports = Instance;