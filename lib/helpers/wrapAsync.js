/**
 * wraps async promise based commands and makes them synchronous executable
 */
var Future = require('fibers/future'),
    ErrorHandler = require('../utils/ErrorHandler'),
    implementedCommands = require('./getImplementedCommands')();

function wrapCommand(origFn) {
    return function() {
        var args = Array.prototype.slice.call(arguments),
            future = new Future();

        var result = origFn.apply(this, args);
        result.then(future.return.bind(future), future.throw.bind(future));
        return future.wait();
    };
}

module.exports = function wrapAsync(instance) {
    Object.keys(implementedCommands).forEach(function assignToInstance(commandName) {
        var origFn = instance[commandName];
        instance[commandName + 'Async'] = origFn;
        instance[commandName] = wrapCommand(origFn);
    });

    /**
     * Adding a command within fiber context doesn't require a special routine
     * since everything runs sync. There is no need to promisify the command.
     */
    instance.addCommand = function(fnName, fn, forceOverwrite) {
        if(instance[fnName] && !forceOverwrite) {
            throw new ErrorHandler.RuntimeError('Command "' + fnName + '" is already defined!');
        }
        instance[fnName] = fn;
    };
};