/**
 * Works just like execute, only you can use selectors to pass html elements to
 * the function you wish to execute in the browser.
 *
 * The function fn will receive every resolved selector as an array of html elements,
 * even if there is only one result, or no result.
 * These arrays are the first arguments the function fn receives.
 * If you pass an array of selectors, the resulting html element arrays are returned in the same order.
 *
 * All arguments you append after function fn are added as the arguments after the html arrays.
 * You can use any JSON value or a function as such an argument.
 *
 * <example>
 	:selectorExecute.js
	client.selectorExecute("//div", function(divs, message) {
		return divs.length + message;
	}, " divs on the page", callback); // returns, for example, "68 divs on the page"
 * </example>
 *
 * @param {String|Array.<String>} selectors
 * @param {Function} fn
 * @param {...*} arg - arguments added to fn. Can be any JSON value or function
 * @uses protocol/execute
 * @type action
 * @see execute
 */

var ensureClientS = require('../helpers/ensureClientSideSelectorSupport'),
	createSelectorScript = require('../helpers/createSelectorScript'),
	async = require('async'),
	util = require('util'),
	merge = require('deepmerge'),
	ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function selectorExecute(selector, script) {
	var args = Array.prototype.slice.call(arguments, 2),
		response = {},
		callback = args.pop(),
		self = this;

	typeof selector === "string" && (selector = [selector]);

	if (!util.isArray(selector)) {
		return callback(new ErrorHandler.CommandError('Argument \'selector\' must be string or array of strings.'));
	}
	if (!/string|function/.test(typeof script)) {
		return callback(new ErrorHandler.CommandError('Argument \'script\' must be a function or string.'));
	}

	var fullScript = createSelectorScript(script, selector, args);

	async.waterfall([
		function(cb) {
			ensureClientS.call(self, cb);
		},
		function(res, cb) {
			response = merge(res, response);
			self.execute(fullScript, cb);
		}
	], function(err, res) {
		response.executeSelector = res;
		callback(err, res && res.value, response);
	});
};