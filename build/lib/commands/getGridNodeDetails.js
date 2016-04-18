/**
 *
 * Get the details of the Selenium Grid node running a session
 *
 * <example>
    :grid.js
    browser.getGridNodeDetails().then(function(details) {
        console.log(details);

        // {
        //     success: true,
        //     msg: "proxy found !",
        //     id: "MacMiniA10",
        //     request: {
        //         ...
        //         configuration: {
        //             ...
        //         },
        //         capabilities: [
        //             {
        //                 ...
        //             }
        //         ]
        //     }
        // }
    })
 * </example>
 *
 * @uses protocol/gridTestSession, protocol/gridProxyDetails
 * @type grid
 */

'use strict';

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});
var getGridNodeDetails = function getGridNodeDetails() {
    var _this = this;

    return this.gridTestSession().then(function (session) {
        return _this.gridProxyDetails(session.proxyId).then(function (details) {
            delete session.msg;
            delete session.success;

            delete details.msg;
            delete details.success;
            delete details.id;

            return _Object$assign(details, session);
        });
    })['catch'](function (e) {
        if (e.seleniumStack && e.seleniumStack.type === 'GridApiError') {
            return {
                error: e.message
            };
        }
    });
};

exports['default'] = getGridNodeDetails;
module.exports = exports['default'];
