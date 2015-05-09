'use strict';

var ConfigParser = require('./utils/ConfigParser');

var init = function(configFile, argv) {

    var configParser = new ConfigParser();
    configParser.addConfigFile(configFile);

    console.log(configParser.getSpecs());
};

module.exports.init = init;