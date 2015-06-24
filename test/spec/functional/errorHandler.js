var WebdriverIO = require('../../../index');

describe('ErrorHandler', function() {

    it('should accessible through module object', function() {
        WebdriverIO.hasOwnProperty('ErrorHandler').should.be.true;
    });

    it('should throw selenium error when passing specific error ID', function() {
        var error = new WebdriverIO.ErrorHandler(17);
        error.name.should.be.exactly('Error');
    });

});