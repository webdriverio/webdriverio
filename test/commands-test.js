var assert         = require('chai').assert,
    fs             = require('fs'),
    webdriverjs    = require('../index'),
    startSelenium  = require('./startSelenium'),
    testpageURL    = 'http://webdriverjs.christian-bromann.com/',
    githubTitle    = 'GitHub · Build software better, together.',
    testpageTitle  = 'WebdriverJS Testpage',
    testpageSource = "";

describe('test webdriverjs API', function(){

    this.timeout(99999999);

    var client = {};

    before(function(done){
        // start selenium server if not running
        startSelenium(function() {

            // init client
            var capabilities =  {
                'browserName': 'phantomjs'
            };
            client = webdriverjs.remote({desiredCapabilities:capabilities});
            client
                .init()
                .url(testpageURL);

            // load source of testpage for getSource() test
            fs.readFile('./test/index.html', function (err, html) {
                if (err) {
                    throw err;
                }
                testpageSource = html.toString();
            });

            done();
        });
    });

    describe('test commands', function(){
        it('get commands should return the evaluated value', function(done){
            client
                .getAttribute('.nested', 'style', function(result) {
                    assert.strictEqual(result,'text-transform: uppercase; ');
                })
                .getElementCssProperty('css selector', '.red', 'background-color', function(result) {
                    assert.strictEqual('rgba(255, 0, 0, 1)',result);
                })
                .getCssProperty('.green', 'float', function(result) {
                    assert.strictEqual('left',result);
                })
                .getElementCssProperty('class name', 'yellow', 'width', function(result) {
                    assert.strictEqual('100px',result);
                })
                .getCssProperty('.black', 'background-color', function(result) {
                    assert.strictEqual('rgba(0, 0, 0, 1)',result);
                })
                .getElementCssProperty('id', 'purplebox', 'margin-right', function(result) {
                    assert.strictEqual('10px',result);
                })
                .getCssProperty('.purple', 'margin-right', function(result) {
                    assert.strictEqual('10px',result);
                })
                .getElementSize('.red', function(result) {
                    assert.strictEqual(result.width,102);
                    assert.strictEqual(result.height,102);
                })
                .getLocation('.green', function(result) {
                    assert.strictEqual(result.x,120);
                    assert.strictEqual(result.y,89);
                })
                .getLocationInView('.green', function(result) {
                    assert.strictEqual(result.x,120);
                    assert.strictEqual(result.y,89);
                })
                .getSource(function(result) {
                    assert.strictEqual(result,testpageSource);
                })
                .getTagName('.black', function(result) {
                    assert.strictEqual(result,'div');
                })
                .getTagName('#githubRepo', function(result) {
                    assert.strictEqual(result,'a');
                })
                .getText('#githubRepo', function(result) {
                    assert.strictEqual(result,'GitHub Repo');
                })
                .getTitle(function(title) {
                    assert.strictEqual(title,testpageTitle);
                    done();
                });
        });

        it('back/foward should return to the previous/next page', function(done) {
            client
                .getTitle(function(title) {
                    assert.strictEqual(title,testpageTitle);
                })
                .click('#githubRepo')
                // waitFor fix, to get safari a little bit more time to load
                .waitFor('.teaser-illustration',5000)
                .getTitle(function(title) {
                    assert.strictEqual(title,githubTitle);
                })
                .back()
                // waitFor fix, to get safari a little bit more time to load
                .waitFor('.public',5000)
                .getTitle(function(title) {
                    assert.strictEqual(title,testpageTitle);
                })
                .forward()
                .waitFor('.teaser-illustration',5000)
                .getTitle(function(title) {
                    assert.strictEqual(title,githubTitle);
                })
                .end(done);
        });
    });

    after(function() {
        client.end();
    });
});