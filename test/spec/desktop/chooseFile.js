describe('choosing a file in an <input type=file>', function() {
    before(h.setup());

    var path = require('path');
    var toUpload = path.join(__dirname, '..', '..', 'fixtures', 'cat-to-upload.gif');

    it('uploads a file and fills the form with it', function(done) {
        this.client
            .chooseFile('#upload-test', toUpload, function(err) {
                assert.ifError(err);
            })
            .getValue('#upload-test', function(err, val) {
                assert.ifError(err);
                assert.ok(/cat\-to\-upload\.gif$/.test(val));
            })
            .call(done);
    });

    it('errors if file does not exists', function(done) {
        this.client
            .chooseFile('#upload-test', '$#$#940358435', function(err) {
                assert.notEqual(err, null);
                done();
            });
    });
});