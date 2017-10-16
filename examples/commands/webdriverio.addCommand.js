var webdriverio = require('../../build/index');
var helper = require('./helpers/externalAddCommandHelper');

var client = webdriverio.remote({
    desiredCapabilities: {
        browserName: 'chrome'
    }
});

client.addCommand('searchWebdriverIO', helper.searchWebdriverIO.bind(client));

var SearchString = 'click';

client
    .init()
    .searchWebdriverIO(SearchString) //external helper function
    .getTitle().then(function(title) {
        console.log('Title was: ' + title);
    })
    .end()
    .catch((e) => console.log(e));
