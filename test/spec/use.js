describe('use', function () {

    before(h.setup);

    var commandModule = function() {

        var self = this;
        this.addCommand('foo', function(cb) {
            self
                .setValue('form input[name="a"]', "fooooooo")
                .setValue('form input[name="b"]', "baaaaaar")
                .call(cb);
        });

    }

    before(function(done) {
        done();
    });

    it('Adding commands with use()', function(done) {

        this.client.use(commandModule);

        this.client
            .foo()
            .getValue('form input[name="a"]', function(err, value) {
                assert.equal(value, 'fooooooo');
            })
            .getValue('form input[name="b"]', function(err, value) {
                assert.equal(value, 'baaaaaar');
            })
            .call(done);


    });

});
