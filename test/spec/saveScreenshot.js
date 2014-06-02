var gm = require('gm');

describe('saveScreenshot', function() {

    before(h.setup());

    it('should take a screenshot of current viewport', function(done) {

        var windowSize = {};

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

                    (500).should.be.exactly(size.width);
                    // window height should be greater because of all menubars
                    (500).should.be.above(size.height);

                    done();
                });

            });

    });

    it('should take a screenshot of the whole website', function(done) {

        var windowSize = {};

        this.client
            .saveScreenshot('test2.png', true)
            .execute(function() {
                return {
                    width: document.documentElement.scrollWidth,
                    height: document.documentElement.scrollHeight
                };
            }, function(err, res) {

                var windowSize = res.value;

                gm(__dirname + '/../../test2.png').size(function (err, size) {
                    if (err) {
                        done(err);
                    }

                    /**
                     * between devices and platform this can be different
                     */
                    size.width.should.be.approximately(windowSize.width, 50);
                    size.height.should.be.approximately(windowSize.height, 50);

                    done();
                });

            });

    });

});