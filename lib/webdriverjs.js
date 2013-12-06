var buildPrototype = require('./utils/buildPrototype.js');
var chainIt = require('chainit');
var realPath = require('./utils/realPath.js');

buildPrototype(
    WebdriverJs.prototype,
    ['commands', 'protocol'].map(realPath(__dirname))
);

// save a reference to the chained API
var Wdjs =
    module.exports =
    chainIt(WebdriverJs);

function WebdriverJs(options) {
    var merge = require('lodash.merge');
    var log = require('./utils/log.js');
    var RequestHandler = require('./utils/RequestHandler.js');

    options = options || {};

    this.sessionId = null;

    this.desiredCapabilities = merge({
        browserName: "firefox",
        version: "",
        javascriptEnabled: true,
        platform: "ANY"
    }, options.desiredCapabilities || {});

    if (options && options.username && options.accessKey) {
        this._authString = options.username+":"+options.accessKey;
    }

    this.requestHandler = new RequestHandler(options);

    this.log = log({
        logLevel: options.logLevel || 'silent',
        screenshotPath: options.screenshotPath
    });
};

// use the chained API reference to add static methods
Wdjs.remote = function remote(options) {
    var singleton = require('pragma-singleton')(Wdjs);
    if (options.singleton) {
        return new singleton(options);
    } else {
        return new Wdjs(options);
    }
}