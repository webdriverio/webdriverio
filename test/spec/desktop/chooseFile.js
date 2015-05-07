describe('choosing a file in an <input type=file>', function() {
    before(h.setup());

    var path = require('path');
    var toUpload = path.join(__dirname, '..', '..', 'fixtures', 'cat-to-upload.gif');

    it('uploads a file and fills the form with it', function() {
        return this.client.chooseFile('#upload-test', toUpload).catch(function(err) {
            assert.ifError(err);
        }).getValue('#upload-test').then(function(val) {
            assert.ok(/cat\-to\-upload\.gif$/.test(val));
        });
    });

    it('errors if file does not exists', function() {
        return this.client.chooseFile('#upload-test', '$#$#940358435').catch(function(err) {
            assert.notEqual(err, null);
        });
    });
});