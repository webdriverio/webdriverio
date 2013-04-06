var assert         = require('chai').assert,
    should         = require('chai').should(),
    fs             = require('fs'),
    webdriverjs    = require('../index'),
    startSelenium  = require('./startSelenium'),
    testpageURL    = 'http://webdriverjs.christian-bromann.com/',
    githubTitle    = 'GitHub · Build software better, together.',
    testpageTitle  = 'WebdriverJS Testpage',
    testpageSource = "",
    capabilities   = {};

describe('test webdriverjs API', function(){

    this.timeout(99999999);

    var client = {};

    before(function(done){
        // start selenium server if not running
        startSelenium(function() {

            // init client
            capabilities =  {
                'browserName': 'chrome',
                'chrome.binary': '/Applications/Browser/Google Chrome.app/Contents/MacOS/Google Chrome'
                // 'firefox_binary': '/Applications/Browser/Firefox.app/Contents/MacOS/firefox'
            };

            client = webdriverjs.remote({logLevel:'verbose',desiredCapabilities:capabilities});
            client.init();

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
                .url(testpageURL)
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
                    assert(result.y === 89 || result.y === 94);
                })
                .getLocationInView('.green', function(result) {
                    assert.strictEqual(result.x,120);
                    assert(result.y === 89 || result.y === 94);
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
                })
                .call(done);
        });

        it('should set, get and delete cookies',function(done) {
            client
                .url(testpageURL)
                .setCookie({name: 'test',value: 'cookie saved!'})
                .getCookie('test', function(result) {
                    assert.strictEqual(result.name,'test');
                    assert.strictEqual(result.value,'cookie saved!');
                })
                .deleteCookie('test')
                .getCookie('test', function(result) {
                    assert.strictEqual(result,null);
                })
                .call(done);
        });

        it('back/foward should return to the previous/next page', function(done) {
            client
                .url(testpageURL)
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
                .call(done);
        });

        it.only('click command test',function(done) {
            client
                .url(testpageURL)
                .isVisible('.btn1',function(result) {
                    if(result) {
                        client.click('.btn1',function(result) {
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn1_clicked',function(result){
                    assert(result, '.btn1 was clicked');
                })
                .isVisible('.btn2',function(result) {
                    if(result) {
                        client.click('.btn2',function(result) {
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn2_clicked',function(result){
                    assert(!result, '.btn2 wasn\'t clicked');
                })
                .isVisible('.btn3',function(result) {
                    if(result) {
                        client.click('.btn3',function(result) {
                            // phantomjs is able to click on a not clickable button
                            if(capabilities.browserName === 'phantomjs') {
                                result.status.should.equal(0);
                            } else {
                                result.status.should.equal(13);
                            }
                        });
                    }
                })
                .saveScreenshot('test.png')
                .isVisible('.btn3_clicked',function(result){
                    // phantomjs is able to click on a not clickable button
                    if(capabilities.browserName === 'phantomjs') {
                        assert(result, '.btn3 wasn\'t clicked');
                    } else {
                        assert(!result, '.btn3 was clicked');
                    }
                })
                .isVisible('.btn4',function(result) {
                    if(result) {
                        client.click('.btn4',function(result) {
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn4_clicked',function(result){
                    // it is possible to click on a button with width/height = 0
                    assert(result, '.btn3 was clicked');
                })
                .call(done);
        });

        it('test addCommand feature',function(done) {
            client
                .addCommand("getUrlAndTitle", function(callback) {
                    this.url(function(urlResult) {
                        this.getTitle(function(titleResult) {
                            var specialResult = {url: urlResult.value, title: titleResult};
                            if (typeof callback == "function") {
                                callback(specialResult);
                            }
                        });
                    });
                })
                .url('http://www.github.com')
                .getUrlAndTitle(function(result){
                    assert.strictEqual(result.url,'https://github.com/');
                    assert.strictEqual(result.title,'GitHub · Build software better, together.');
                })
                .call(done);
        });

    });

    after(function() {
        client.end();
    });
});