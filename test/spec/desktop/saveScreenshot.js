var fs = require('fs'),
    path = require('path');

describe('saveScreenshot', function() {

    before(h.setup());

    it('should take a screenshot and output it on a desired location', function(done) {

        var screenshotPath = path.join(__dirname, '..', '..', '..', 'test.png');

        this.client
            .saveScreenshot(screenshotPath)
            .call(function() {
                fs.exists(screenshotPath, function(fileExists) {
                    fileExists.should.be.true;
                    done();
                })
            });

    });

    it('should take a screenshot and return it as a PNG image in Buffer', function(done) {
        this.client
            .saveScreenshot(function(err, image) {
                assert.ifError(err);

                // Check for PNG header
                assert.equal(image.toString('hex', 0, 4), '89504e47');
            })
            .call(done);
    });

});