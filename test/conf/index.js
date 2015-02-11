var merge = require('deepmerge');

var env = process.env.TRAVIS && process.env._BROWSER !== 'phantomjs' && process.env._ENV !== 'multibrowser' ? 'travis-ci' : 'local';

var defaults = require('./defaults.js');
var asked = require('./' + env + '.js');

if(process.env._ENV === 'mobile') {
    var mobile = require('./mobile');
    asked = merge(asked,mobile);
}

module.exports = merge(defaults, asked);