describe('using the uploadFile helper', function() {
    before(h.setup);

    var path = require('path');
    var toUpload = path.join(__dirname, '..', '..', 'fixtures', 'cat-to-upload.gif');

    it('uploads a file to the distant client', function(done) {
        this.client
            .uploadFile(toUpload, function(err, res) {
                assert.equal(null, err);
                assert.ok(res.value);
                assert.ok(/cat\-to\-upload\.gif$/.test(res.value));
                done(err);
            });
    });
});