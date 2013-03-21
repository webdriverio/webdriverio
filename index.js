/**
 * webdriverjs
 * https://github.com/Camme/webdriverjs
 *
 * A WebDriver module for nodejs. Either use the super easy help commands or use the base
 * Webdriver wire protocol commands. Its totally inspired by jellyfishs webdriver, but the
 * goal is to make all the webdriver protocol items available, as near the original as possible.
 *
 * Copyright (c) 2013 Camilo Tapia <camilo.tapia@gmail.com>
 * Licensed under the MIT license.
 * 
 * Contributors:
 *     Dan Jenkins <dan.jenkins@holidayextras.com>
 *     Christian Bromann <mail@christian-bromann.com>
 */

var singletonInstance = null,
    WebdriverJS       = require('./lib/webdriverjs');

// expose the man function
// if we need a singleton, we provide the option here
exports.remote = function(options) {

    // make sure we have a default options if none are provided
    options = options || {};
    console.log(WebdriverJS);
    if (options.singleton) {
        if (!singletonInstance) {
            singletonInstance = new WebdriverJS(options);
        }
        return singletonInstance;
    } else {
        return new WebdriverJS(options);
    }
};