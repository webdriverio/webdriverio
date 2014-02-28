'use strict';

/**
 * EventHandler
 */

var util   = require('util'),
    events = require('events');

function EventHandler() {
    events.EventEmitter.call(this);
};

EventHandler.getInstance = function(opts) {
    if(this.instance === null){
        this.instance = new EventHandler(opts);
    }
    return this.instance;
}

EventHandler.instance = null;
util.inherits(EventHandler, events.EventEmitter);

// return singleton instance of the EventHandler object
module.exports = EventHandler.getInstance();