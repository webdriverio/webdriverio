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
    .timeoutsAsyncScript(5000)
    .selectorExecuteAsync('//div', function(inputs, message, callback){

        setTimeout(callback.bind(null, inputs.length + ' ' + message), 2500);

    }, 'divs on the page')
    .then(function(res){
        console.log(res);
    })
    .end();