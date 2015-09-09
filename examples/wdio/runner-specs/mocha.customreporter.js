describe('my app', function() {

    before(function() {
        console.log('inner before hook');
    });

    describe('has feature xyz that', function() {

        it('should to something', function() {
            console.log('inner test block');
        });

    });

    after(function() {
        console.log('inner after hook');
    });

});