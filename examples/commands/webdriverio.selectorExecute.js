var webdriverio = require('../../build/index');

var options = {
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

var client = webdriverio.remote(options);

client
    .init()
    .url('https://news.ycombinator.com/')
    .selectorExecute('//div', function(inputs, message){
        return inputs.length + ' ' + message;
    }, 'divs on the page')
    .then(function(res){
        console.log(res);
    })
    .end();
