var webdriverio = require('../index'),
    Q = require('q');

var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

webdriverio
    .remote(options)
    .init()
    .url('https://news.ycombinator.com/')
    .selectorExecuteAsync('//input', function(inputs, message, callback){
        callback(inputs.length + ' ' + message);
    }, 'inputs on the page')
    .then(function(res){
        console.log(res);
    })
    .end();