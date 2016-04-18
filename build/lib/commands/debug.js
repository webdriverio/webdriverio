/**
 *
 * This command helps you to debug your integration tests. It stops the running queue and gives
 * you time to jump into the browser and check the state of your application (e.g. using the
 * dev tools). Once you are done go to the command line and press Enter.
 *
 * Make sure you increase the timeout property of your test framework your are using (e.g. Mocha
 * or Jasmine) in order to prevent the continuation due to a test timeout.
 *
 * <example>
    :debugAsync.js
    client
        .setValue('#input', 'FOO')
        .debug() // jumping into the browser and change value of #input to 'BAR'
        .getValue('#input').then(function(value) {
            console.log(value); // outputs: "BAR"
        });

    :debugSync.js
    it('should demonstrate the debug command', function () {
        browser
            .setValue('#input', 'FOO')
            .debug() // jumping into the browser and change value of #input to 'BAR'

        var value = browser.getValue('#input');
        console.log(value); // outputs: "BAR"
    });
 * </example>
 *
 * @type utility
 *
 */

'use strict';

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var debug = function debug() {
    var _this = this;

    var RL = _readline2['default'].createInterface({
        input: process.stdin,
        output: process.stdout
    });

    var logLevel = this.logger.logLevel;
    this.logger.logLevel = 'verbose';
    this.logger.debug();

    return new _Promise(function (resolve) {
        RL.question('', function () {
            _this.logger.logLevel = logLevel;
            RL.close();
            resolve();
        });
    });
};

exports['default'] = debug;
module.exports = exports['default'];
