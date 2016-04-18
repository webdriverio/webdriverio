'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = [
/**
 * stale reference error handler
 */
function (e) {
    if (!e.seleniumStack || e.seleniumStack.type !== 'StaleElementReference') {
        return;
    }

    /**
     * get through command list and find most recent command where an element(s)
     * command contained the failing json web element
     */
    var failingCommand = this.commandList.slice(-1)[0];

    var commandToRepeat = undefined;
    for (var i = this.commandList.length - 1; i >= 0; --i) {
        var command = this.commandList[i];

        if (command.name !== 'element' && command.name !== 'elements') {
            continue;
        }
        if (command.name === 'element' && (!command.result[0].value || command.result[0].value.ELEMENT !== failingCommand.args[0])) {
            continue;
        }

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(command.result.value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var result = _step.value;

                if (result.ELEMENT === failingCommand.args[0]) {
                    commandToRepeat = this.commandList[i - 1];
                    break;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        if (commandToRepeat) {
            break;
        }
    }

    if (!commandToRepeat) {
        return;
    }

    return this[commandToRepeat.name].apply(this, commandToRepeat.args);
}];
module.exports = exports['default'];
