/* jshint -W024 */
/* jshint expr:true */

var chai           = require('chai'),
    assert         = chai.assert,
    should         = chai.should(),
    expect         = chai.expect;
    fs             = require('fs'),
    webdriverjs    = require('../index'),
    startSelenium  = require('./startSelenium'),
    testpageURL    = 'http://webdriverjs.christian-bromann.com/',
    testpageURL    = 'http://wdjs.local/',
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
                'browserName': 'phantomjs',
                // 'firefox_switches': ['-height=200','-width=200'],
                // 'chrome.binary': '/Applications/Browser/Google Chrome.app/Contents/MacOS/Google Chrome'
                // 'firefox_binary': '/Applications/Browser/Firefox.app/Contents/MacOS/firefox'
            };

            client = webdriverjs.remote({logLevel:'silent',desiredCapabilities:capabilities});
            client.init();

            // load source of testpage for getSource() test
            fs.readFile('./test/index.php', function (err, html) {
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
                .getAttribute('.nested', 'style', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result,'text-transform: uppercase; ');
                })
                .getElementCssProperty('css selector', '.red', 'background-color', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('rgba(255, 0, 0, 1)',result);
                })
                .getCssProperty('.green', 'float', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('left',result);
                })
                .getElementCssProperty('class name', 'yellow', 'width', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('100px',result);
                })
                .getCssProperty('.black', 'background-color', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('rgba(0, 0, 0, 1)',result);
                })
                .getElementCssProperty('id', 'purplebox', 'margin-right', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('10px',result);
                })
                .getCssProperty('.purple', 'margin-right', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('10px',result);
                })
                .getElementSize('.red', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result.width,102);
                    assert.strictEqual(result.height,102);
                })
                .getLocation('.green', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result.x,120);
                    assert(result.y === 89 || result.y === 94);
                })
                .getLocationInView('.green', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result.x,120);
                    assert(result.y === 89 || result.y === 94);
                })
                .getSource(function(err,result) {
                    expect(err).to.be.null;

                    // remove not visible php code
                    testpageSource = testpageSource.replace(/<\?php[^?]*\?>\n/g,'');

                    assert.strictEqual(result,testpageSource);
                })
                .getTagName('.black', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result,'div');
                })
                .getTagName('#githubRepo', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result,'a');
                })
                .getText('#githubRepo', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result,'GitHub Repo');
                })
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,testpageTitle);
                })
                .call(done);
        });

        it('should set, get and delete cookies',function(done) {
            client
                .url(testpageURL)
                .setCookie({name: 'test',value: 'cookie saved!'})
                .getCookie('test', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result.name,'test');
                    assert.strictEqual(result.value,'cookie saved!');
                })
                .setCookie({name: 'test2',value: 'cookie2 saved!'})
                .deleteCookie('test')
                .getCookie('test', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result,null);
                })
                .getCookie('test2', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result.name,'test2');
                    assert.strictEqual(result.value,'cookie2 saved!');
                })
                .setCookie({name: 'test',value: 'cookie saved!'})
                .deleteCookie()
                .getCookie('test', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result,null);
                })
                .getCookie('test2', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result,null);
                })
                .call(done);
        });

        it('back/foward should return to the previous/next page', function(done) {
            client
                .url(testpageURL)
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,testpageTitle);
                })
                .click('#githubRepo')
                // waitFor fix, to get safari a little bit more time to load
                .waitFor('.teaser-illustration',5000)
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,githubTitle);
                })
                .back()
                // waitFor fix, to get safari a little bit more time to load
                .waitFor('.public',5000)
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,testpageTitle);
                })
                .forward()
                .waitFor('.teaser-illustration',5000)
                .getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,githubTitle);
                })
                .call(done);
        });

        it('click command test',function(done) {
            client
                .url(testpageURL)
                .isVisible('.btn1',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.click('.btn1',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn1_clicked',function(err,result){
                    expect(err).to.be.null;
                    assert(result, '.btn1 was clicked');
                })
                .isVisible('.btn2',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.click('.btn2',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn2_clicked',function(err,result){
                    expect(err).to.be.null;
                    assert(!result, '.btn2 wasn\'t clicked');
                })
                .isVisible('.btn3',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.click('.btn3',function(err,result) {
                            expect(err).to.be.null;
                            // phantomjs is able to click on a not clickable button
                            if(capabilities.browserName === 'phantomjs') {
                                result.status.should.equal(0);
                            } else {
                                result.status.should.equal(13);
                            }
                        });
                    }
                })
                .isVisible('.btn3_clicked',function(err,result){
                    expect(err).to.be.null;

                    // phantomjs is able to click on a not clickable button
                    if(capabilities.browserName === 'phantomjs') {
                        assert(result, '.btn3 wasn\'t clicked');
                    } else {
                        assert(!result, '.btn3 was clicked');
                    }
                })
                .isVisible('.btn4',function(err,result) {
                    expect(err).to.be.null;
                    if(result) {
                        client.click('.btn4',function(err,result) {
                            expect(err).to.be.null;
                            result.status.should.equal(0);
                        });
                    }
                })
                .isVisible('.btn4_clicked',function(err,result){
                    expect(err).to.be.null;

                    // it is possible to click on a button with width/height = 0
                    assert(result, '.btn3 was clicked');
                })
                .call(done);
        });

        it('test addCommand feature',function(done) {
            client
                .addCommand("getUrlAndTitle", function(callback) {
                    this.url(function(err,urlResult) {
                        this.getTitle(function(err,titleResult) {
                            var specialResult = {url: urlResult.value, title: titleResult};
                            if (typeof callback == "function") {
                                callback(err,specialResult);
                            }
                        });
                    });
                })
                .url('http://www.github.com')
                .getUrlAndTitle(function(err,result){
                    expect(err).to.be.null;
                    assert.strictEqual(result.url,'https://github.com/');
                    assert.strictEqual(result.title,'GitHub · Build software better, together.');
                })
                .call(done);
        });

        it('test setting values in input elements',function(done) {
            client.url(testpageURL);

            var checkError = function(err) {
                expect(err).to.be.null;
            };
            var chechValue = function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result,'9');
            };

            for(var i = 0; i < 10; ++i) {
                client
                    .setValue('input.searchinput','0', checkError)
                    .setValue('input.searchinput','1', checkError)
                    .setValue('input.searchinput','2', checkError)
                    .setValue('input.searchinput','3', checkError)
                    .setValue('input.searchinput','4', checkError)
                    .setValue('input.searchinput','5', checkError)
                    .setValue('input.searchinput','6', checkError)
                    .setValue('input.searchinput','7', checkError)
                    .setValue('input.searchinput','8', checkError)
                    .setValue('input.searchinput','9', checkError)
                    .getValue('input.searchinput',     chechValue)
                    .clearElement('input.searchinput', checkError);
            }

            client.call(done);
        });

        it('test adding value in input elements',function(done) {
            client.url(testpageURL);

            var checkError = function(err) {
                expect(err).to.be.null;
            };
            var chechValue = function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result,'0123456789');
            };

            for(var i = 0; i < 10; ++i) {
                client
                    .addValue('input.searchinput','0', checkError)
                    .addValue('input.searchinput','1', checkError)
                    .addValue('input.searchinput','2', checkError)
                    .addValue('input.searchinput','3', checkError)
                    .addValue('input.searchinput','4', checkError)
                    .addValue('input.searchinput','5', checkError)
                    .addValue('input.searchinput','6', checkError)
                    .addValue('input.searchinput','7', checkError)
                    .addValue('input.searchinput','8', checkError)
                    .addValue('input.searchinput','9', checkError)
                    .getValue('input.searchinput',     chechValue)
                    .clearElement('input.searchinput', checkError);
            }

            client.call(done);
        });

        it('click on submit button should work as well as submitForm command', function(done) {

            var elementShouldBeNotFound = function(err,result) {
                err.should.not.equal.null;
                assert.strictEqual(result.status,13);
            };
            var elementShouldBeVisible = function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result,true);
            };
            var shouldCauseNoError = function(err) {
                expect(err).to.be.null;
            };

            client
                .url(testpageURL)
                .isVisible('.gotDataA', elementShouldBeNotFound)
                .isVisible('.gotDataB', elementShouldBeNotFound)
                .isVisible('.gotDataC', elementShouldBeNotFound)
                .click('.send',         shouldCauseNoError)
                .isVisible('.gotDataA', elementShouldBeVisible)
                .isVisible('.gotDataB', elementShouldBeVisible)
                .isVisible('.gotDataC', elementShouldBeVisible)

                .url(testpageURL)
                .isVisible('.gotDataA', elementShouldBeNotFound)
                .isVisible('.gotDataB', elementShouldBeNotFound)
                .isVisible('.gotDataC', elementShouldBeNotFound)
                .submitForm('.send',    shouldCauseNoError)
                .isVisible('.gotDataA', elementShouldBeVisible)
                .isVisible('.gotDataB', elementShouldBeVisible)
                .isVisible('.gotDataC', elementShouldBeVisible)
                .call(done);
        });


        it('waitfor works when chained and wait the specified amount of time if the elemtn doesnt exist', function(done) {

            var startTime = 10000000000000;
            client
                .url(testpageURL)
                .call(function() {
                    startTime = Date.now();
                })
                .waitFor('#new-element', 3000) // this element doesnt exist
                .call(function() {
                    var delta = Date.now() - startTime;
                    delta.should.be.within(2999,5000);
                    done();
                });

        });

        it('closeAll ends all sessions', function(done) {

            var client1 = webdriverjs.remote({logLevel:'silent',desiredCapabilities:capabilities}).init();
            var client2 = webdriverjs.remote({logLevel:'silent',desiredCapabilities:capabilities}).init();

            client1.url(testpageURL).call(function() {
                client2.url(testpageURL).call(function() {
                    webdriverjs.endAll(function(err) {
                        webdriverjs.sessions(function(err, sessions) {
                            should.not.exist(err);
                            sessions.should.have.lengthOf(0);
                            require("child_process").exec("ps aux | grep 'phantomjs'", function(err, result) {
                                result = result.replace(/grep 'phantomjs'/g, '');
                                result = result.replace(/grep phantomjs/g, '');
                                result.should.not.include('phantomjs');
                                done();
                            });
                        });
                    });
                });
            });
        });


    });

    after(function() {
        client.end();
        //});
    });

});
