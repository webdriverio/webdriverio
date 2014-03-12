var buildPrototype = require('./utils/buildPrototype.js');
var chainIt = require('chainit');
var realPath = require('./utils/realPath.js');

buildPrototype(
    WebdriverJs.prototype,
    ['commands', 'protocol'].map(realPath(__dirname))
);

// save a reference to the chained API
var Wdjs = module.exports = WebdriverJs;

function WebdriverJs(options) {
    var merge = require('deepmerge');
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

    // Used as a shortcut to load command packages as modules, instead of single commands
    var self = this;
    this.use = function(commandModule) {
        commandModule.call(self);
    }

    // addCommand added here because it's synchronous and thus does not need
    // to be added to asynchronous chain.
    this.addCommand = function(name, fn) {
        chainIt.add(this, name, fn);

        // we still returns the instance so that we can continue chaining
        return this;
    };
}
