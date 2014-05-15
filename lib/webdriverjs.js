var buildPrototype = require('./utils/buildPrototype.js'),
    chainIt        = require('chainit'),
    realPath       = require('./utils/realPath.js'),
    EventHandler   = require('./utils/EventHandler.js');


buildPrototype(
    WebdriverJs.prototype,
    ['commands', 'protocol'].map(realPath(__dirname))
);

// save a reference to the chained API
var Wdjs = module.exports = WebdriverJs;

function WebdriverJs(options) {
    var self   = this,
        merge  = require('deepmerge'),
        Logger = require('./utils/Logger.js'),
        RequestHandler = require('./utils/RequestHandler.js');

    this.options = merge({
        host: '127.0.0.1',
        port: 4444,
        experimental: false
    }, options || {});

    this.sessionId = null;

    this.desiredCapabilities = merge({
        browserName: 'firefox',
        version: '',
        javascriptEnabled: true,
        platform: 'ANY'
    }, options.desiredCapabilities || {});

    this.requestHandler = new RequestHandler(this);
    this.eventHandler = new EventHandler(this);
    this.logger = new Logger(this);

    // Used as a shortcut to load command packages as modules, instead of single commands
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
};