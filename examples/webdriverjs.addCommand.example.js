var webdriverjs = require('../index');
var helper = require('./webdriverjs.externalAddCommandHelper')

var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};
client = webdriverjs.remote(options);
client.addCommand('searchGoogle',helper.searchGoogle.bind(client));

var SearchString = 'webdriver.io';

client
    .init()
    .searchGoogle(SearchString, function(err){}) //external helper function
    .title(function(err, res) {
        console.log('Title was: ' + res.value);
    })
    .end();