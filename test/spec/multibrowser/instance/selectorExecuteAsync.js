/* global document */
describe('selectorExecuteAsync executed by single multibrowser instance', function() {
    before(h.setupMultibrowser());

    // TODO: css, xpath, name, id, tag name, link text, partial link text
    it('should be able to resolve a css selector', function(done) {
        this.browserA
            .selectorExecuteAsync('[class="sometext"]', function(arr) {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    return cb(arr[0].innerHTML);
                }, 100);
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("some text", res);
                done(err);
            });
    });

    it('should be able to resolve an xpath selector', function(done) {
        this.browserA
            .selectorExecuteAsync('//*[@class="sometext"]', function(arr) {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    return cb(arr[0].innerHTML);
                }, 100);
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("some text", res);
                done(err);
            });
    });

    it('should be able to resolve a name selector', function(done) {
        this.browserA
            .selectorExecuteAsync('[name="searchinput"]', function(arr) {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(arr[0].getAttribute('name'));
                }, 100);
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("searchinput", res);
                done(err);
            });
    });

    it('should be able to resolve an id selector', function(done) {
        this.browserA
            .selectorExecuteAsync('#selectbox', function(arr) {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(arr[0].getAttribute('id'));
                }, 100);
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("selectbox", res);
                done(err);
            });
    });

    it('should be able to resolve a tag name selector', function(done) {
        this.browserA
            .selectorExecuteAsync('<select />', function(arr) {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    var found = 'nothing found';
                    arr.forEach(function(el) {
                        if (el.getAttribute('id') === "selectbox") {
                            found = "selectbox found";
                        }
                    });
                    cb(found);
                }, 100);
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("selectbox found", res);
                done(err);
            });
    });

    it('should be able to resolve a link text selector', function(done) {
        this.browserA
            .selectorExecuteAsync('=GitHub Repo', function(arr) {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(arr.length > 0 && arr[0].getAttribute('id'));
                }, 100);
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("githubRepo", res);
                done(err);
            });
    });

    it('should be able to resolve a partial link text selector', function(done) {
        this.browserA
            .selectorExecuteAsync('*=GitHub ', function(arr) {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(arr.length > 0 && arr[0].getAttribute('id'));
                }, 100);
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("githubRepo", res);
                done(err);
            });
    });

    it('should be able to accept args', function(done) {
        this.browserA
            .selectorExecuteAsync('*=GitHub ', function(arr, arg) {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(arr.length > 0 && arr[0].getAttribute('id') + arg);
                }, 100);
            }, " with an argument", function(err, res) {
                assert.ifError(err);
                assert.equal("githubRepo with an argument", res);
                done(err);
            });
    });

    it('should be able to pass functions as args', function(done) {
        this.browserA
            .selectorExecuteAsync('*=GitHub ', function(arr, arg) {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    cb(arg(arr.length > 0 && arr[0].getAttribute('id')));
                }, 100);
            }, function(str) {
                return str + " with an argument";
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("githubRepo with an argument", res);
                done(err);
            });
    });

    it('should be able to accept multiple selectors', function(done) {
        this.browserA
            .selectorExecuteAsync(['*=GitHub ', '//html/body/section/h1'], function(links, divs, arg) {
                var cb = arguments[arguments.length - 1];
                setTimeout(function() {
                    var returnStr = 'Returning ';
                    links.length > 0 && (returnStr += links[0].getAttribute('id'));
                    returnStr += " and ";
                    divs.length > 0 && (returnStr += divs[0].innerHTML);
                    cb(arg(returnStr));
                }, 100);
            }, function(str) {
                return str + " with an argument";
            }, function(err, res) {
                assert.ifError(err);
                assert.equal("Returning githubRepo and Test CSS Attributes with an argument", res);
                done(err);
            });
    });

});