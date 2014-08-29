/* global document */
describe('selectorExecute', function() {
    before(h.setup());

    // TODO: css, xpath, name, id, tag name, link text, partial link text
    it('should be able to resolve a css selector', function(done) {
        this.client
            .selectorExecute('[class="sometext"]', function(arr) {
                return arr[0].innerHTML
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("some text", res);
                done(err);
            });
    });

    it('should be able to resolve an xpath selector', function(done) {
        this.client
            .selectorExecute('//*[@class="sometext"]', function(arr) {
                return arr[0].innerHTML
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("some text", res);
                done(err);
            });
    });

    it('should be able to resolve a name selector', function(done) {
        this.client
            .selectorExecute('[name="searchinput"]', function(arr) {
                return arr[0].getAttribute('name')
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("searchinput", res);
                done(err);
            });
    });

    it('should be able to resolve an id selector', function(done) {
        this.client
            .selectorExecute('#selectbox', function(arr) {
                return arr[0].getAttribute('id');
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("selectbox", res);
                done(err);
            });
    });

    it('should be able to resolve a tag name selector', function(done) {
        this.client
            .selectorExecute('<select />', function(arr) {
                var found = 'nothing found';
                arr.forEach(function(el) {
                    if (el.getAttribute('id') === "selectbox") {
                        found = "selectbox found";
                    }
                });
                return found;
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("selectbox found", res);
                done(err);
            });
    });

    it('should be able to resolve a link text selector', function(done) {
        this.client
            .selectorExecute('=GitHub Repo', function(arr) {
                return arr.length > 0 && arr[0].getAttribute('id');
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("githubRepo", res);
                done(err);
            });
    });

    it('should be able to resolve a partial link text selector', function(done) {
        this.client
            .selectorExecute('*=GitHub ', function(arr) {
                return arr.length > 0 && arr[0].getAttribute('id');
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("githubRepo", res);
                done(err);
            });
    });

    it('should be able to accept args', function(done) {
        this.client
            .selectorExecute('*=GitHub ', function(arr, arg) {
                return arr.length > 0 && arr[0].getAttribute('id') + arg;
            }, " with an argument", function(err, res) {
                assert.ifError(err);
                assert.equal("githubRepo with an argument", res);
                done(err);
            });
    });

    it('should be able to pass functions as args', function(done) {
        this.client
            .selectorExecute('*=GitHub ', function(arr, arg) {
                return arg(arr.length > 0 && arr[0].getAttribute('id'));
            }, function(str) {
                return str + " with an argument";
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("githubRepo with an argument", res);
                done(err);
            });
    });

    it('should be able to accept multiple selectors', function(done) {
        this.client
            .selectorExecute(['*=GitHub ', '//*[@class="sometext"]'], function(links, divs, arg) {
                var returnStr = 'Returning ';
                links.length > 0 && (returnStr += links[0].getAttribute('id'));
                returnStr += " and ";
                divs.length > 0 && (returnStr += divs[0].innerHTML);
                return arg(returnStr);
            }, function(str) {
                return str + " with an argument";
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("Returning githubRepo and some text with an argument", res);
                done(err);
            });
    });

});