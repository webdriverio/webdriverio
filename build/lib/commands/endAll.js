/**
 *
 * End all selenium server sessions at once.
 *
 * @uses protocol/sessions, protocol/session
 * @type utility
 *
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});
var endAll = function endAll() {
    var _this = this;

    return this.sessions().then(function (res) {
        var sessionCommands = [];

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(res.value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var session = _step.value;

                sessionCommands.push(_this.session('delete', session.id));
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

        return _this.unify(sessionCommands);
    });
};

exports['default'] = endAll;
module.exports = exports['default'];
