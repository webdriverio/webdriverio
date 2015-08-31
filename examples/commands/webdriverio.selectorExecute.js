var webdriverio = require('../../index');

var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

webdriverio
    .remote(options)
    .init()
    .url('https://news.ycombinator.com/')
    .selectorExecute('//div', function(inputs, message){
        return inputs.length + ' ' + message;
    }, 'divs on the page')
    .then(function(res){
        console.log(res);
    })
    .end();