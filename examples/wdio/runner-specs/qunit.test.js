QUnit.test("should pass on a basic assertion", function(assert) {
    assert.ok(true, "Basic assertion works");
});

QUnit.skip('should be a pending test');

QUnit.module("Async module");

QUnit.test('should have the right title - the good old callback way', function(assert) {
    var done = assert.async();
    browser
        .url('/')
        .getTitle(function(err, title) {
            assert.equal(err, undefined);
            assert.equal(title, 'WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
        })
        .call(done);
});

QUnit.test('should have the right title - the promise way', function(assert) {
    return browser
        .url('/')
        .getTitle().then(function(title) {
            assert.equal(title, 'WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
        });
});

// NOTE: On Node 0.10 and below, the generator `function*` syntax in the following
// tests will break the parser. Use Babel (`require("babel/register")` in
// wdio.mocha.conf.js) or similar to transpile this code for older Nodes.

QUnit.test('should have the right title - the fancy generator way', function*(assert) {
    yield browser.url('/');
    var title = yield browser.getTitle();
    assert.equal(title, 'WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
});
