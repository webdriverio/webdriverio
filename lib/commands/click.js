/**
 *
 * Click on an element based on given selector.
 *
 * <example>
    :example.html
    <button id="myButton" onclick="document.getElementById('someText').innerHTML='I was clicked'">Click me</button>
    <div id="someText">I was not clicked</div>

    :click.js
    client
        .click('#myButton')
        .getText('#someText', function(err, value) {
            assert(err === null);
            assert(value === 'I was clicked'); // true
        });
 * </example>
 *
 * @param {String} selector element to click on. If it matches with more than one DOM-element it automatically clicks on the first element
 * @callbackParameter error
 *
 * @uses protocol/element, protocol/elementIdClick, protocol/touchClick
 * @type action
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function click (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with click command'));
    }

    var self = this,
        response = {};

    if(!this.isMobile) {

        async.waterfall([
            function(cb) {
                self.element(selector, cb);
            },
            function(res, cb) {
                response.element = res;
                self.elementIdClick(res.value.ELEMENT, cb);
            },
            function(res, cb) {
                response.elementIdClick = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    } else {

        async.waterfall([
            function(cb) {
                self.element(selector, cb);
            },
            function(res, cb) {
                response.element = res;
                self.touchClick(res.value.ELEMENT, cb);
            },
            function(res, cb) {
                response.touchClick = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    }

};

