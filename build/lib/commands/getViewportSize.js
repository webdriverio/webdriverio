/**
 *
 * Get viewport size of the current browser window.
 *
 * <example>
    :getViewportSizeAsync.js
    client
        .url('http://webdriver.io')
        .getViewportSize().then(function(size) {
            console.log(size); // outputs: {width: 1024, height: 768}
        })
        .getViewportSize('width').then(function(size) {
            console.log(size); // outputs: 1024
        })
        .getViewportSize('height').then(function(size) {
            console.log(size); // outputs: 768
        });
 * </example>
 *
 * @param {String} property  if "width" or "height" is set it returns only that property
 * @returns {Object}  viewport width and height of the browser
 * @uses protocol/execute
 * @type window
 *
 */

'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _scriptsGetViewportSize = require('../scripts/getViewportSize');

var _scriptsGetViewportSize2 = _interopRequireDefault(_scriptsGetViewportSize);

var getViewportSize = function getViewportSize(prop) {
    return this.execute(_scriptsGetViewportSize2['default']).then(function (res) {
        if (typeof prop === 'string' && prop.match(/(width|height)/)) {
            prop = 'screen' + prop.slice(0, 1).toUpperCase() + prop.slice(1);
            return res.value[prop];
        }

        return {
            width: res.value.screenWidth || 0,
            height: res.value.screenHeight || 0
        };
    });
};

exports['default'] = getViewportSize;
module.exports = exports['default'];
