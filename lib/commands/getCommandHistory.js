/**
 *
 * Returns a list of previous called commands + their arguments.
 *
 * <example>
    :getCommandHistory.js
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

let getCommandHistory = function () {
    return this.commandList.slice(0, -1)
}

export default getCommandHistory
