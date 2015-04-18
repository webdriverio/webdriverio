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
    .elements('.pagetop>a')
    .then(function (elements) {
        var self = this,
            promises = [];

        elements.value.forEach(function (element) {
            var id = element.ELEMENT;

            promises.push(
                self
                    .elementIdText(id)
                    .then(function (res) {
                        return res.value;
                    }
                )
            );
        });

        return Q.all(promises);
    })

    .then(function (inputValues) {
        console.log(inputValues);
    })

    .end()
    .finally(function () {
        console.log('Client ended');
    });