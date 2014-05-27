var gm = require('gm');

describe('saveScreenshot', function() {

    before(h.setup());

    it('should take a screenshot of current viewport', function(done) {

        var windowSize = {};

        this.client
            .saveScreenshot('test1.png')
            .windowHandleSize(function(err,res) {
                windowSize = res.value;
            })
            .call(function() {

                gm(__dirname + '/../../test1.png').size(function (err, size) {
                    if (err) {
                        done(err);
                    }

                    size.width.should.be.exactly(windowSize.width);
                    // window height should be greater because of all menubars
                    windowSize.height.should.be.above(size.height);

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

                    size.width.should.be.exactly(windowSize.width);
                    size.height.should.be.exactly(windowSize.height);

                    done();
                });

            });

    });

});