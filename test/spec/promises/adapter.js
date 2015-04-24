var wdio = require('../../lib/webdriverio')(),
    Q = require('q');

wdio.lift('command', function(shouldPass) {
    var defer = Q.defer();

    setTimeout(function() {
        defer[shouldPass ? 'resolve' : 'reject']();
    }, Math.random() * 1000);

    return defer.promise;
});

wdio.lift('resolved', function(value) {
    return value;
});

wdio.lift('rejected', function(reason) {

});

var client = wdio({
    desiredCapabilities: {
        browserName: 'chrome'
    }
});;

module.exports = {

}