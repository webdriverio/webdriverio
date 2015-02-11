describe('addCommand', function() {

    before(h.setup());

    before(function() {
        var Url = require('url');

        this.client.addCommand('getUrlAndTitle', function(callback) {

            var result = {},
                error;

            this.url(function(err, url) {
                    error = err;
                    result.url = url.value;
                })
                .getTitle(function(err, title) {
                    error = err;
                    result.title = title;
                })
                .call(callback.bind(this, error, result));

        });

        this.client.addCommand('checkArgumentsLength', function(a, b, c, d, callback) {

            var result,
                error;
            callback = arguments[arguments.length - 1];

            if (arguments.length < 5) {
                error = new Error('Fn signature has 5 arguments, received only ' + arguments.length.toString() + ' arguments.');
            } else {
                result = (a || 0) + (b || 0) + (c || 0) + (d || 0);
            }

            this.call(callback.bind(this, error, result));

        });

    });

    it('added a `getUrlAndTitle` command', function(done) {

        this.client
            .getUrlAndTitle(function(err, result) {
                assert.ifError(err);
                assert.strictEqual(result.url, conf.testPage.start);
                assert.strictEqual(result.title, conf.testPage.title);
            })
            .call(done);

    });
    it('calls checkArgumentsLength with proper number of args', function(done) {

        this.client
            .checkArgumentsLength(2, 3, 4, function(err, result) {
                assert.ifError(err);
                assert.strictEqual(result, (2 + 3 + 4))
            })
            .call(done);
    });

});
