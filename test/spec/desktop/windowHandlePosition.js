describe('windowHandlePosition', function() {

    before(h.setup());

    it('should return window position', function(done) {

        var self = this,
            check = function(err, res) {
                assert.ifError(err);

                res.value.x.should.be.above(process.env.TRAVIS ? -9 : 1);
                res.value.y.should.be.above(process.env.TRAVIS ? -9 : 1);
            };

        this.client
            // use current tab id as a valid one
            .getCurrentTabId(function(err, tabid) {
                assert.ifError(err);

                // specified window
                self.client.windowHandlePosition(tabid, check);

                // current window
                self.client.windowHandlePosition(check);
            })
            .call(done);

    });

    it('should change window position', function(done) {

        var self = this;

        this.client
            // use current tab id as a valid one
            .getCurrentTabId(function(err, tabid) {
                assert.ifError(err);

                // specified window
                self.client.windowHandlePosition(tabid, {x: 300, y: 150});
                self.client.windowHandlePosition(tabid, function(err, res) {
                    assert.ifError(err);

                    res.value.x.should.be.exactly(300);
                    res.value.y.should.be.exactly(150);
                });

                // current window
                self.client.windowHandlePosition({x: 400, y: 250});
                self.client.windowHandlePosition(function(err, res) {
                    assert.ifError(err);

                    res.value.x.should.be.exactly(400);
                    res.value.y.should.be.exactly(250);
                });
            })
            .call(done);

    });

});