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

    this.options = merge({
        host: '127.0.0.1',
        port: 4444
    }, options || {});

    this.sessionId = null;

    this.desiredCapabilities = merge({
        browserName: 'firefox',
        version: '',
        javascriptEnabled: true,
        platform: 'ANY'
    }, options.desiredCapabilities || {});

    this.requestHandler = new RequestHandler(this.options);

    this.log = log({
        logLevel: this.options.logLevel || 'silent',
        screenshotPath: this.options.screenshotPath
    });
}

// use the chained API reference to add static methods
Wdjs.remote = function remote(options, Constructor) {
    if (typeof options === 'function') {
        Constructor = options;
        options = {};
    } else {
        options = options || {};

        // allows easy webdriverjs-$framework creation (like webdriverjs-angular)
        Constructor = Constructor || Wdjs;
    }

    var singleton = require('pragma-singleton')(Constructor);
    if (options.singleton) {
        return new singleton(options);
    } else {
        return new Constructor(options);
    }
};

// addCommand added here because it's synchronous and thus does not need
// to be added to asynchronous chain.
Wdjs.prototype.addCommand = function(name, fn) {
    chainIt.add(this, name, fn);

    // we still returns the instance so that we can continue chaining
    return this;
};