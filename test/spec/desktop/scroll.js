/* global document */
describe('scroll', function() {

    before(h.setup());

    it('should scroll to specific x and y position', function(done) {
        this.client
            .windowHandleSize({width: 100, height: 100})
            .scroll(100, 100)
            .execute(function() {
                return {
                    x: $(document).scrollLeft(),
                    y: $(document).scrollTop(),
                };
            }, function(err, res) {
                assert.ifError(err);
                res.value.x.should.be.exactly(100);
                res.value.y.should.be.exactly(100);

            })
            .call(done);
    });

    it('should scroll to specific element', function(done) {
        this.client
            .windowHandleSize({width: 100, height: 100})
            .scroll('.box')
            .execute(function() {
                return {
                    x: $(document).scrollLeft(),
                    y: $(document).scrollTop(),
                };
            }, function(err, res) {
                assert.ifError(err);
                res.value.x.should.be.approximately(15, 15);
                res.value.y.should.be.approximately(262, 40);

            })
            .call(done);
    });

    it('should scroll to specific element with offset', function(done) {
        this.client
            .windowHandleSize({width: 100, height: 100})
            .scroll('.box', -10, -22)
            .execute(function() {
                return {
                    x: $(document).scrollLeft(),
                    y: $(document).scrollTop(),
                };
            }, function(err, res) {
                assert.ifError(err);
                res.value.x.should.be.approximately(5, 15);
                res.value.y.should.be.approximately(240, 40);

            })
            .call(done);
    });


});