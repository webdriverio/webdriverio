var webdriverio = require('../../build/index');
var helper = require('./webdriverio.externalAddCommandHelper');

var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};
var client = webdriverio.remote(options);
client.addCommand('searchGoogle',helper.searchGoogle.bind(client));

var SearchString = 'webdriver.io';

client
    .init()
    .searchGoogle(SearchString) //external helper function
    .title(function(err, res) {
        console.log('Title was: ' + res.value);
    })
    .end();
