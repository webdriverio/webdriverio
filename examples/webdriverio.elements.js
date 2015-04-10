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
    .url('http://www.google.com')
    .elements('input[type="submit"]')
    .then(function (elements) {
        elements = elements.value;

        var promises = [];

        elements.forEach(function (element) {
            element = element.ELEMENT;
            var promise = this
                .elementIdAttribute(element, 'type')
                .then(function (val) {
                    console.log(val);
                });


            promises.push(promise);
        }.bind(this));

        return Q.all(promises);
    })

    .end()
    .then(function(){
        //TODO: get the promise after .end() working
        console.log('Client ended');
    });