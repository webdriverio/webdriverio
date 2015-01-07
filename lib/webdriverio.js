var buildPrototype = require('./utils/buildPrototype'),
    chainIt        = require('chainit'),
    realPath       = require('./utils/realPath.js'),
    EventHandler   = require('./utils/EventHandler'),
    PromiseHandler = require('./utils/PromiseHandler'),
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
        Logger = require('./utils/Logger'),
        RequestHandler = require('./utils/RequestHandler');

    /**
     * ensure that options is typeof object
     */
    this.options = {};
    if (typeof options === 'object') {
        this.options = merge({
            host: '127.0.0.1',
            port: 4444,
            waitforTimeout: 500,
            coloredLogs: true
        }, options);
    }

    /**
     * only set globals we wouldn't get otherwise
     */
    GLOBAL.WDIO_GLOBALS = {
        coloredLogs: this.options.coloredLogs
    };

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

    /**
     * Used as a shortcut to load command packages as modules, instead of single commands
     */
    this.use = function(commandModule) {
        commandModule.call(self);
    };

    /**
     * addCommand added here because it's synchronous and thus does not need
     * to be added to asynchronous chain.
     */
    this.addCommand = function(name, fn) {
        chainIt.add(this, name, fn);

        /**
         * promisify new commands
         */
        this[name] = PromiseHandler(name, this[name]);

        /**
         * we still returns the instance so that we can continue chaining
         */
        return this;
    };

    this.transferPromiseness = function(target, promise) {
        /**
         * transfer WebdriverIO commands
         */
        if(typeof target.desiredCapabilities === 'undefined') {
            Object.keys(WebdriverIO.prototype).forEach(function(fnName) {
                if(typeof promise[fnName] !== 'function') {
                    return;
                }

                target[fnName] = promise[fnName].bind(promise);
            });
        }

        /**
         * transfer supported promise handlers
         */
        ['then', 'catch', 'fail', 'finally', 'fin', 'done', 'thenResolve', 'thenReject'].forEach(function(methodName) {
            if (promise[methodName]) {
                target[methodName] = promise[methodName].bind(promise);
            }
        });
    }
}