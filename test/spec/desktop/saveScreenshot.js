var fs = require('fs'),
    path = require('path');

describe('saveScreenshot', function() {

    before(h.setup());

    it('should take a screenshot and output it on a desired location', function() {

        var screenshotPath = path.join(__dirname, '..', '..', '..', 'test.png');

        return this.client.saveScreenshot(screenshotPath).then(function() {
            fs.existsSync(screenshotPath).should.be.true;
        });

    });

    it('should take a screenshot and return it as a PNG image in Buffer', function() {
        return this.client.saveScreenshot(function(image) {
            expect(image).to.exist;
            // Check for PNG header
            expect(image.toString('hex', 0, 4)).to.equal('89504e47');
        });
    });

});
