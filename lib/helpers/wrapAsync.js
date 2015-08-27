/**
 * wraps async promise based commands and makes them synchronous executable
 */
var Future = require('fibers/future'),
    implementedCommands = require('./getImplementedCommands')();

module.exports = function remotesync(instance) {
    Object.keys(implementedCommands).forEach(function(commandName) {
        var origFn = instance[commandName];
        instance[commandName + 'Async'] = origFn;
        instance[commandName] = function() {
            var args = Array.prototype.slice.call(arguments),
                future = new Future();

            var result = origFn.apply(this, args);
            result.then(future.return.bind(future), future.throw.bind(future));
            return future.wait();
        }
    });

    return instance;
};