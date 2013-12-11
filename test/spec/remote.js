describe('remote method without options', function() {
    it('does not fails', function() {
        var webdriverjs = require('../../index.js');
        var client = webdriverjs.remote();
    });
})