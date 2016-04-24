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
            // [ { name: 'init', args: [] },
            //   { name: 'url', args: [ 'http://www.google.com' ] },
            //   { name: 'click', args: [ 'body' ] },
            //   { name: 'element',
            //     args: [ 'body' ],
            //     result:
            //      { state: 'success',
            //        sessionId: 'c2aea856-ba18-48c0-8745-aa292f6394bc',
            //        hCode: 1094372184,
            //        value: [Object],
            //        class: 'org.openqa.selenium.remote.Response',
            //        status: 0,
            //        selector: 'body' } },
            //   { name: 'elementIdClick',
            //     args: [ '0' ],
            //     result:
            //      { state: 'success',
            //        sessionId: 'c2aea856-ba18-48c0-8745-aa292f6394bc',
            //        hCode: 1704637158,
            //        value: null,
            //        class: 'org.openqa.selenium.remote.Response',
            //        status: 0 } },
            //   { name: 'addValue', args: [ '#lst-ib', 'webdriverio' ] },
            //   { name: 'elements',
            //     args: [ '#lst-ib' ],
            //     result:
            //      { state: 'success',
            //        sessionId: 'c2aea856-ba18-48c0-8745-aa292f6394bc',
            //        hCode: 1171202369,
            //        value: [Object],
            //        class: 'org.openqa.selenium.remote.Response',
            //        status: 0,
            //        selector: '#lst-ib' } },
            //   { name: 'elementIdValue',
            //     args: [ '1', 'webdriverio' ],
            //     result:
            //      { state: 'success',
            //        sessionId: 'c2aea856-ba18-48c0-8745-aa292f6394bc',
            //        hCode: 447115314,
            //        value: null,
            //        class: 'org.openqa.selenium.remote.Response',
            //        status: 0 } },
            //   { name: 'pause', args: [ 2000 ] } ]
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
