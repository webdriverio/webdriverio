var fs = require('fs'),
    path = require('path');

describe('saveScreenshot', function() {

    before(h.setup());

    var imageSize = {};

    it('should take a screenshot and output it on a desired location', function(done) {

        var screenshotPath = path.join(__dirname, '..', '..', '..', 'test.png');

        this.client
            .saveScreenshot(screenshotPath, true)
            .call(function() {

                fs.exists(screenshotPath, function(fileExists) {
                    fileExists.should.be.true;
                    done();
                })

            });

    });

});