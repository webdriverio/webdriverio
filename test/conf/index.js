var merge = require('lodash.merge');

var env = process.env.TRAVIS && process.env._BROWSER !== 'phantomjs' ? 'travis-ci' : 'local';

var defaults = require('./defaults.js');
var asked = require('./' + env + '.js');

if(process.env._ENV === 'mobile') {
    var mobile = require('./mobile');
    asked = merge(asked,mobile);
}

module.exports = merge(defaults, asked);