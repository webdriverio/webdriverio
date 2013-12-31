describe.only('mobile tests', function() {

	before(h.setup);

	it('should get current orientation', function(done) {

		this.client
            .getOrientation(function(err,res) {
                assert.equal(null, err);
                console.log(res);
                assert.equal(res, 'PORTRAIT');
            })
            .setOrientation('landscape',function(err,res) {
                assert.equal(null, err);
            })
            .getOrientation(function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'LANDSCAPE');
            })
            .call(done);

	});

});