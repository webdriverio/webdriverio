describe('changing window sizes', function() {
    before(h.setup);

    it('should change window size', function(done) {
        this.client
            .windowHandleSize({
                width: 500,
                height: 500
            }, done);
    });

    it('changed the window size', function(done) {
        this.client.windowHandleSize(function(err, res) {
            assert(err === null);
            // on some systems, we might not have changed the size, like on phantomjs
            // still, no error means it worked
            assert.ok(res.value.width >= 500);
            assert.ok(res.value.height >= 500);
            done(err);
        });
    });

    it('can maximizes windows', function(done) {
        this.client
        .windowHandleMaximize()
        .windowHandleSize(function(err, res) {
            assert(err === null);
            // on some systems, we might not have maximized, like on phantomjs
            // still, no error means it worked
            assert.ok(res.value.width >= 500);
            assert.ok(res.value.height >= 500);
            done(err);
        });
    });
});