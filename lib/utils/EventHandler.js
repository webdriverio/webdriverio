'use strict';

/**
 * EventHandler
 */

var util   = require('util'),
    events = require('events');

var EventHandler = function(instance) {

    events.EventEmitter.call(this);
    this.instance = instance;
    this.supportedEvents = ['on','once','removeListener','removeAllListeners','emit'];

    /**
     * expose EventEmitter function to WebdriverJS instance
     * it's a bit hacky solution but the only way to pass functions within methods which
     * will not treat as callbacks
     */
    this.supportedEvents.forEach(this.registerCommands.bind(this));

};

// inherit functionality from evenst.EventEmitter
util.inherits(EventHandler, events.EventEmitter);

/**
 * register sync function to an async chain
 * @param  {String[]} funcName  list of commands which should be added to the webdriver instance
 */
EventHandler.prototype.registerCommands = function(funcName) {

    var self = this;

    if(typeof this[funcName] !== 'function') {
        return true;
    }

    /**
     * register EventEmitter function to WebdriverJS instance.
     * The function itself basically just creates a temporary
     * custom command which gets executed immediately. With
     * this approach it is possible to chain synchronous logic
     * within asyncronous workflow.
     */
    this.instance[funcName] = function() {
        var args = arguments;

        /**
         * create temporary custom command. In order to keep
         * the event namespace clean and to avoid overriding
         * a user event by accident two underscore character
         * get prepended.
         */
        self.instance.addCommand('__' + funcName, function(cb) {
            self[funcName].apply(self, Array.prototype.slice.call(args));
            cb();
        });

        /**
         * execute custom command immediately
         */
        self.instance['__' + funcName]();

        /**
         * remove custom command to avoid a possible double execution
         */
        self.instance['__' + funcName] = undefined;

        /**
         * return "this" to make commands chainable
         */
        return self.instance;
    };

};

module.exports = EventHandler;