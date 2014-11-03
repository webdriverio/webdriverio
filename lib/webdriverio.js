var buildPrototype = require('./utils/buildPrototype.js'),
    chainIt        = require('chainit'),
    realPath       = require('./utils/realPath.js'),
    EventHandler   = require('./utils/EventHandler.js'),
    isMobileHelper = require('./helpers/isMobile');

buildPrototype(
    WebdriverIO.prototype,
    ['commands', 'protocol'].map(realPath(__dirname))
);

// save a reference to the chained API
module.exports = WebdriverIO;

function WebdriverIO(options) {
    var self   = this,
        merge  = require('deepmerge'),
        Logger = require('./utils/Logger.js'),
        RequestHandler = require('./utils/RequestHandler.js');

    /**
     * ensure that options is typeof object
     */
    this.options = {};
    if (typeof options === 'object') {
        this.options = merge({
            host: '127.0.0.1',
            port: 4444
        }, options);
    }

    this.desiredCapabilities = merge({
        browserName: 'firefox',
        version: '',
        javascriptEnabled: true,
        locationContextEnabled: true,
        handlesAlerts: true,
        rotatable: true,
        platform: 'ANY'
    }, this.options.desiredCapabilities || {});

    this.isMobile = isMobileHelper(this.desiredCapabilities);
    this.requestHandler = new RequestHandler(this);

    /**
     * if options is typeof string user wants to attach client to an existing session
     */
    if (typeof options === 'string') {
        this.requestHandler.sessionID = options;
    }

    this.eventHandler = new EventHandler(this);
    this.logger = new Logger(this);

    // Used as a shortcut to load command packages as modules, instead of single commands
    this.use = function(commandModule) {
        commandModule.call(self);
    };

    // addCommand added here because it's synchronous and thus does not need
    // to be added to asynchronous chain.
    this.addCommand = function(name, fn) {
        chainIt.add(this, name, fn);

        // we still returns the instance so that we can continue chaining
        return this;
    };

    this.transferPromiseness = function(target, promise) {
        ['then', 'catch', 'fail', 'progress', 'finally', 'fin', 'nodeify'].forEach(function(methodName) {
            if (promise[methodName]) {
                Object.keys(WebdriverIO.prototype).forEach(function(fnName) {
                    target[fnName] = promise[fnName].bind(promise);
                    target.then = promise.then;
                    target.catch = promise.catch;
                    target.fail = promise.fail;
                    target.progress = promise.progress;
                    target.finally = promise.finally;
                });
            }
        });
    }
}