'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var _helpersDetectSeleniumBackend = require('../helpers/detectSeleniumBackend');

var _helpersDetectSeleniumBackend2 = _interopRequireDefault(_helpersDetectSeleniumBackend);

var HOOKS = ['before', 'beforeSuite', 'beforeHook', 'beforeTest', 'beforeCommand', 'afterCommand', 'afterTest', 'afterHook', 'afterSuite', 'after', 'beforeFeature', 'beforeScenario', 'beforeStep', 'afterFeature', 'afterScenario', 'afterStep', 'onError'];

var DEFAULT_TIMEOUT = 10000;
var NOOP = function NOOP() {};
var DEFAULT_CONFIGS = {
    sync: true,
    specs: [],
    suites: {},
    exclude: [],
    logLevel: 'silent',
    coloredLogs: true,
    baseUrl: null,
    waitforTimeout: 1000,
    framework: 'mocha',
    reporters: [],
    reporterOptions: {},
    maxInstances: 100,
    maxInstancesPerCapability: 100,
    connectionRetryTimeout: 90000,
    connectionRetryCount: 3,

    /**
     * framework defaults
     */
    mochaOpts: {
        timeout: DEFAULT_TIMEOUT
    },
    jasmineNodeOpts: {
        defaultTimeoutInterval: DEFAULT_TIMEOUT
    },

    /**
     * hooks
     */
    onPrepare: NOOP,
    before: [],
    beforeSuite: [],
    beforeHook: [],
    beforeTest: [],
    beforeCommand: [],
    afterCommand: [],
    afterTest: [],
    afterHook: [],
    afterSuite: [],
    after: [],
    onComplete: NOOP,
    onError: [],

    /**
     * cucumber specific hooks
     */
    beforeFeature: [],
    beforeScenario: [],
    beforeStep: [],
    afterFeature: [],
    afterScenario: [],
    afterStep: []
};

var ConfigParser = (function () {
    function ConfigParser() {
        _classCallCheck(this, ConfigParser);

        this._config = DEFAULT_CONFIGS;
        this._capabilities = [];
    }

    /**
     * merges config file with default values
     * @param {String} filename path of file relative to current directory
     */

    _createClass(ConfigParser, [{
        key: 'addConfigFile',
        value: function addConfigFile(filename) {
            if (typeof filename !== 'string') {
                throw new Error('addConfigFile requires filepath');
            }

            var filePath = _path2['default'].resolve(process.cwd(), filename);

            try {
                var fileConfig = require(filePath).config;

                if (typeof fileConfig !== 'object') {
                    throw new Error('configuration file exports no config object');
                }

                /**
                 * merge capabilities
                 */
                this._capabilities = (0, _deepmerge2['default'])(this._capabilities, fileConfig.capabilities || {});
                delete fileConfig.capabilities;

                /**
                 * add service hooks and remove them from config
                 */
                this.addService(fileConfig);
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = _getIterator(HOOKS), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var hookName = _step.value;

                        delete fileConfig[hookName];
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator['return']) {
                            _iterator['return']();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                this._config = (0, _deepmerge2['default'])(this._config, fileConfig);

                /**
                 * detect Selenium backend
                 */
                this._config = (0, _deepmerge2['default'])((0, _helpersDetectSeleniumBackend2['default'])(this._config), this._config);
            } catch (e) {
                console.error('Failed loading configuration file: ' + filePath);
                throw e;
            }
        }

        /**
         * merge external object with config object
         * @param  {Object} object  desired object to merge into the config object
         */
    }, {
        key: 'merge',
        value: function merge() {
            var object = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

            this._config = (0, _deepmerge2['default'])(this._config, object);

            /**
             * user and key could get added via cli arguments so we need to detect again
             * Note: cli arguments are on the right and overwrite config
             */
            this._config = (0, _deepmerge2['default'])((0, _helpersDetectSeleniumBackend2['default'])(this._config), this._config);
        }

        /**
         * add hooks from services to runner config
         * @param {Object} service  a service is basically an object that contains hook methods
         */
    }, {
        key: 'addService',
        value: function addService(service) {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = _getIterator(HOOKS), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var hookName = _step2.value;

                    if (!service[hookName]) {
                        continue;
                    } else if (typeof service[hookName] === 'function') {
                        this._config[hookName].push(service[hookName].bind(service));
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                        _iterator2['return']();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }
        }

        /**
         * get excluded files from config pattern
         */
    }, {
        key: 'getSpecs',
        value: function getSpecs(capSpecs, capExclude) {
            var specs = ConfigParser.getFilePaths(this._config.specs);
            var exclude = ConfigParser.getFilePaths(this._config.exclude);

            /**
             * check if user has specified a specific suite to run
             */
            var suite = this._config.suites[this._config.suite];
            if (suite && Array.isArray(suite)) {
                specs = ConfigParser.getFilePaths(suite);
            }

            if (Array.isArray(capSpecs)) {
                specs = specs.concat(ConfigParser.getFilePaths(capSpecs));
            }
            if (Array.isArray(capExclude)) {
                exclude = exclude.concat(ConfigParser.getFilePaths(capExclude));
            }

            return specs.filter(function (spec) {
                return exclude.indexOf(spec) < 0;
            });
        }

        /**
         * return configs
         */
    }, {
        key: 'getConfig',
        value: function getConfig() {
            return this._config;
        }

        /**
         * return capabilities
         */
    }, {
        key: 'getCapabilities',
        value: function getCapabilities(i) {
            if (typeof i === 'number' && this._capabilities[i]) {
                return this._capabilities[i];
            }

            return this._capabilities;
        }

        /**
         * returns a flatten list of globed files
         *
         * @param  {String[]} filenames  list of files to glob
         * @return {String[]} list of files
         */
    }], [{
        key: 'getFilePaths',
        value: function getFilePaths(patterns, omitWarnings) {
            var files = [];

            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = _getIterator(patterns), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var pattern = _step3.value;

                    var filenames = _glob2['default'].sync(pattern);

                    filenames = filenames.filter(function (filename) {
                        return filename.slice(-3) === '.js' || filename.slice(-3) === '.ts' || filename.slice(-8) === '.feature' || filename.slice(-7) === '.coffee';
                    });

                    filenames = filenames.map(function (filename) {
                        return _path2['default'].isAbsolute(filename) ? _path2['default'].normalize(filename) : _path2['default'].resolve(process.cwd(), filename);
                    });

                    if (filenames.length === 0 && !omitWarnings) {
                        console.warn('pattern', pattern, 'did not match any file');
                    }

                    files = (0, _deepmerge2['default'])(files, filenames);
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                        _iterator3['return']();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            return files;
        }
    }]);

    return ConfigParser;
})();

exports['default'] = ConfigParser;
module.exports = exports['default'];
