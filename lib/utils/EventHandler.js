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
    this.browserEvents = {};
    this.supportedEvents = ['on','once','removeListener','removeAllListeners','emit'];

    /**
     * if experimental mode is enabled, start socket connection to communicate
     * with the browser to register browser side eventlisteners
     */
    if(this.instance.options.experimental) {
        this.startSocketServer();
        this.supportedEvents.push('addEventListener');
        this.supportedEvents.push('removeEventListener');
    }

    /**
     * expose EventEmitter function to WebdriverJS instance
     * it's a bit hacky solution but the only way to pass functions within methods which
     * will not treat as callbacks
     */
    this.supportedEvents.forEach(function(funcName) {

        if(typeof self[funcName] !== 'function') {
            return true;
        }

        /**
         * register EventEmitter function to WebdriverJS instance.
         * The function itself basically just creates a temporary
         * custom command which gets executed immediately. With
         * this approach it is possible to chain synchronous logic
         * within asyncronous workflow.
         */
        self.instance[funcName] = function() {
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
            })

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
        }

    });
};

// inherit functionality from evenst.EventEmitter
util.inherits(EventHandler, events.EventEmitter);

/**
 * start socket connection
 */
/* istanbul ignore next */
EventHandler.prototype.startSocketServer = function startSocketServer() {
    var that = this,
        socketio = require('socket.io');

    this.app = require('http').createServer();
    this.io  = socketio.listen(this.app, { log: false });
    this.app.listen(5555);

    this.io.sockets.on('connection', function (socket) {
        that.socket = socket;
    });
};

/* istanbul ignore next */
EventHandler.prototype.addEventListener = function(eventName,elem,callback,useCapture) {

    if(!this.socket) {
        // try again after 100ms
        return setTimeout(this.addEventListener.bind(this,eventName,elem,callback,useCapture), 100);
    }

    // store registered event to be able to remove listener
    if(!this.browserEvents[eventName + '-' + elem]) {
        this.browserEvents[eventName + '-' + elem] = [];

        // register event on client side
        this.socket.emit('addEventListener', {
            eventName: eventName,
            elem: elem,
            useCapture: useCapture || false
        });
    }
    this.browserEvents[eventName + '-' + elem].push(callback.toString());

    // register event on server side
    this.socket.on(eventName + '-' + elem,callback);

};

/* istanbul ignore next */
EventHandler.prototype.removeEventListener = function(eventName,elem,callback,useCapture) {

    if(!this.socket) {
        // try again after 100ms
        return setTimeout(this.removeEventListener.bind(this,eventName,elem,callback,useCapture), 100);
    } else if(!this.browserEvents[eventName + '-' + elem] || !this.browserEvents[eventName + '-' + elem].length) {
        return this;
    }

    var that = this;

    // get stored event listener
    this.browserEvents[eventName + '-' + elem].forEach(function(listener, i) {
        if(listener === callback.toString()) {
            // remove listener in event list
            that.browserEvents[eventName + '-' + elem].splice(i,1);

            // remove listener on server side
            that.socket.removeListener(eventName + '-' + elem,callback);

            // break loop
            return false;
        }
    });

    // remove event listener on client side if there is no listener anymore
    if(this.browserEvents[eventName + '-' + elem].length === 0) {
        this.socket.emit('removeEventListener', {
            eventName: eventName,
            elem: elem,
            useCapture: useCapture || false
        });
    }

};

module.exports = EventHandler;