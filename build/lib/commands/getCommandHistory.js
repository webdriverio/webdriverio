/**
 *
 * Returns a list of previous called commands + their arguments.
 *
 * <example>
    :getCommandHistoryAsync.js
    client
        .init()
        .url('http://www.google.com')
        .click('#username')
        .addValue('#password', 'text')
        .pause(2000)
        .getCommandHistory().then(function(history){
            console.log(history);
            // outputs:
            // [{
            //     command: 'init',
            //     args: []
            // },{
            //     command: 'click',
            //     args: ['#username']
            // },{
            //     command: 'addValue',
            //     args: ['#password', 'text']
            // },{
            //     command: 'pause',
            //     args: [2000]
            // }]
        })
        .end();
 * </example>
 *
 * @returns {Object[]} list of recent called commands + their arguments
 * @type utility
 *
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var getCommandHistory = function getCommandHistory() {
    return this.commandList.slice(0, -1);
};

exports["default"] = getCommandHistory;
module.exports = exports["default"];
