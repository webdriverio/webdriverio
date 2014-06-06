var gm = require('gm');

describe('saveScreenshot', function() {

    before(h.setup());

    var imageSize = {};

    it('should take a screenshot of the whole website', function(done) {

        /**
         * this test wont work in firefoxdriver because it automatically
         * takes a screenshot of the whole browser dimension
         */
        if(this.client.desiredCapabilities.browserName === 'firefox') {
            return done();
        }

        this.client
            .windowHandleSize({ width: 1500, height: 500 })
            .saveScreenshot('test2.png', true)
            .call(function() {

                gm(__dirname + '/../../test2.png').size(function (err, size) {
                    if (err) {
                        done(err);
                    }

                    imageSize = size;
                    done();
                });

            });

    });

    it('should take a screenshot of current viewport', function(done) {

        /**
         * this test wont work in firefoxdriver because it automatically
         * takes a screenshot of the whole browser dimension
         */
        if(this.client.desiredCapabilities.browserName === 'firefox') {
            return done();
        }

        this.client
            .windowHandleSize({ width: 500, height: 500 })
            .saveScreenshot('test1.png')
            .call(function() {

                gm(__dirname + '/../../test1.png').size(function (err, size) {
                    if (err) {
                        done(err);
                    }

                    /**
                     * between devices and platform this can be different
                     */
                    imageSize.width.should.be.above(size.width);
                    imageSize.height.should.be.above(size.height);

                    done();
                });

            });

    });

});