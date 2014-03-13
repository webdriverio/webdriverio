'use strict';

/**
 * EventHandler
 */

var util   = require('util'),
    events = require('events');

var EventHandler = function(instance) {
    var self = this;

    events.EventEmitter.call(this);
    this.instance = instance;

    /**
     * expose EventEmitter function to WebdriverJS instance
     * it's a bit hacky solution but the only way to pass functions within methods which
     * will not treat as callbacks
     */
    ['on','once','removeListener','removeAllListeners','emit'].forEach(function(funcName) {

        if(typeof self[funcName] !== 'function') {
            return true;
        }

        self.instance[funcName] = function() {
            var args = arguments;

            self.instance.addCommand('__' + funcName, function(cb) {
                self[funcName].apply(self, Array.prototype.slice.call(args));
                cb();
            })

            self.instance['__' + funcName]();
            self.instance['__' + funcName] = undefined;

            return self.instance;
        }

    });
}

// inherit functionality from evenst.EventEmitter
util.inherits(EventHandler, events.EventEmitter);

// return singleton instance of the EventHandler object
module.exports = EventHandler;