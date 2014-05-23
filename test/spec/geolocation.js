// phantomjs does not support geolocation
if(conf.desiredCapabilities.browserName === 'phantomjs') {
    return false;
}

describe('geolocation API', function() {

    before(h.setup());

    it('should return the current geolocation', function(done) {
        this.client.getGeoLocation(function(err,res) {
            console.log(err,res);
        }).call(done);
    });

});
