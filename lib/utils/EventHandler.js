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

    if(this.instance.options.experimental) {
        this.startSocketServer();
    }

    /**
     * expose EventEmitter function to WebdriverJS instance
     * it's a bit hacky solution but the only way to pass functions within methods which
     * will not treat as callbacks
     */
    ['on','once','removeListener','removeAllListeners','emit','addEventListener'].forEach(function(funcName) {

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

EventHandler.prototype.startSocketServer = function startSocketServer() {
    var that = this,
        app = require('http').createServer(),
        socketio = require('socket.io');

    console.log('Starting Socket Server');
    this.io = socketio.listen(app, { log: false });
    app.listen(5555);

    this.io.sockets.on('connection', function (socket) {
        console.log('Connection to browser extension established');
        that.socket = socket;
    });
};

EventHandler.prototype.addEventListener = function(eventName,elem,callback) {

    if(!this.socket) {
        return false;
    }

    this.socket.emit('addEventListener', {
        eventName: eventName,
        elem: elem
    });

    this.socket.on(eventName,callback);

};

module.exports = EventHandler;