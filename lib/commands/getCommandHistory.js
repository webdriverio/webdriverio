/**
 *
 * Returns a list of previous called commands + their arguments and execution timestamp.
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
            // [ { name: 'init', args: [], timestamp: 1487078962707 },
            //   { name: 'url', args: [ 'http://www.google.com' ], timestamp: 1487078962707 },
            //   { name: 'click', args: [ 'body' ], timestamp: 1487078962707 },
            //   { name: 'element',
            //     args: [ 'body' ],
            //     timestamp: 1487078962707,
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
            //     timestamp: 1487078962707,
            //     result:
            //      { state: 'success',
            //        sessionId: 'c2aea856-ba18-48c0-8745-aa292f6394bc',
            //        hCode: 1704637158,
            //        value: null,
            //        class: 'org.openqa.selenium.remote.Response',
            //        status: 0 } },
            //   { name: 'addValue', args: [ '#lst-ib', 'webdriverio' ], timestamp: 1487078962707 },
            //   { name: 'elements',
            //     args: [ '#lst-ib' ],
            //     timestamp: 1487078962707,
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
            //     timestamp: 1487078962707,
            //     result:
            //      { state: 'success',
            //        sessionId: 'c2aea856-ba18-48c0-8745-aa292f6394bc',
            //        hCode: 447115314,
            //        value: null,
            //        class: 'org.openqa.selenium.remote.Response',
            //        status: 0 } },
            //   { name: 'pause', args: [ 2000 ], timestamp: 1487078962707 } ]
        })
        .end();
 * </example>
 *
 * @alias browser.getCommandHistory
 * @return {Object[]} list of recent called commands + their arguments
 * @type utility
 *
 */

let getCommandHistory = function () {
    return this.commandList.slice(0, -1)
}

export default getCommandHistory
