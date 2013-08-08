/* jshint -W024 */
/* jshint expr:true */

var chai           = require('chai'),
    assert         = chai.assert,
    should         = chai.should(),
    expect         = chai.expect;
    fs             = require('fs'),
    webdriverjs    = require('../index'),
    testpageURL    = 'http://webdriverjs.christian-bromann.com/',
    githubTitle    = 'GitHub · Build software better, together.',
    testpageTitle  = 'WebdriverJS Testpage',
    testpageSource = "";

// test capabilities
var capabilities   = {
    browserName: 'phantomjs',
    // version: '27',
    // platform: 'XP',
    // tags: ['webdriverjs','api','test'],
    // name: 'webdriverjs API test'
};

describe('webdriverjs API test', function(){

    this.timeout(99999999);

    var client = {};

    before(function(done){

        // init client
        client = webdriverjs.remote({
            desiredCapabilities:capabilities,
            logLevel: 'silent',
            // host: 'ondemand.saucelabs.com',
            // user: process.env.SAUCE_USERNAME,
            // key: process.env.SAUCE_ACCESS_KEY
        });
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

    describe('test commands', function(){
        describe('get commands should return the evaluated value', function() {

            before(function(done) {
                client.url(testpageURL).call(done);
            });

            it('getAttribute: style of elem .nested should be "text-transform:uppercase;"', function(done){
                client.getAttribute('.nested', 'style', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result,'text-transform:uppercase;');
                }).call(done);
            });

            it('getElementCssProperty: css selector of elem .red should be "rgba(255,0,0,1)"', function(done){
                client.getElementCssProperty('css selector', '.red', 'background-color', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('rgba(255,0,0,1)',result);
                }).call(done);
            });

            it('getCssProperty: float css attribute of .green should be "left"', function(done){
                client.getCssProperty('.green', 'float', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('left',result);
                }).call(done);
            });

            it('getElementCssProperty: width of elem with class name yellow should be "100px"', function(done){
                client.getElementCssProperty('class name', 'yellow', 'width', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('100px',result);
                }).call(done);
            });

            it('getCssProperty: background-color of elem .black should be "rgba(0,0,0,1)"', function(done){
                client.getCssProperty('.black', 'background-color', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('rgba(0,0,0,1)',result);
                }).call(done);
            });

            it('getElementCssProperty: leftmargin of elem with ID purplebox should be "10px"', function(done){
                client.getElementCssProperty('id', 'purplebox', 'margin-right', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('10px',result);
                }).call(done);
            });

            it('getCssProperty: rightmargin of elem .purple should be "10px"', function(done){
                client.getCssProperty('.purple', 'margin-right', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual('10px',result);
                }).call(done);
            });

            it('getElementSize: size of elem .red should be 102x102px', function(done){
                client.getElementSize('.red', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result.width,102);
                    assert.strictEqual(result.height,102);
                }).call(done);
            });

            it('getLocation: location of elem .green should be x=120 , y=89', function(done){
                client.getLocation('.green', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result.x,120);
                    assert(result.y === 89 || result.y === 94);
                }).call(done);
            });

            it('getLocationInView: location of elem .green should be x=120 , y=89', function(done){
                client.getLocationInView('.green', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result.x,120);
                    assert(result.y === 89 || result.y === 94);
                }).call(done);
            });

            it('getSource: source code of testpage should be the same as the code, which was fetched before test', function(done){
                client.getSource(function(err,result) {
                    expect(err).to.be.null;

                    // remove not visible php code
                    testpageSource = testpageSource.replace(/<\?php[^?]*\?>\n/g,'');

                    assert.strictEqual(result,testpageSource);
                }).call(done);
            });

            it('getTagName: tag name of elem .black should be "div"', function(done){
                client.getTagName('.black', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result,'div');
                }).call(done);
            });

            it('getTagName: tag name of elem #githubRepo should be "a"', function(done){
                client.getTagName('#githubRepo', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result,'a');
                }).call(done);
            });

            it('getText: content of elem #githubRepo should be "GitHub Repo"', function(done){
                client.getText('#githubRepo', function(err,result) {
                    expect(err).to.be.null;
                    assert.strictEqual(result,'GitHub Repo');
                }).call(done);
            });

            it('getTitle: title of testpage should be "'+testpageTitle+'"', function(done){
                client.getTitle(function(err,title) {
                    expect(err).to.be.null;
                    assert.strictEqual(title,testpageTitle);
                }).call(done);
            });

        });

        describe('test cookie functionality',function() {

            before(function(done) {
                client.url(testpageURL).call(done);
            });

            it('should set a cookie and read its content afterwards', function(done){
                client
                    .setCookie({name: 'test',value: 'cookie saved!'})
                    .getCookie('test', function(err,result) {
                        expect(err).to.be.null;
                        assert.strictEqual(result.name,'test');
                        assert.strictEqual(result.value,'cookie saved!');
                    })
                    .call(done);
            });

            it('should delete created cookie and is not able to read its content', function(done){
                client
                    .deleteCookie('test')
                    .getCookie('test', function(err,result) {
                        expect(err).to.be.null;
                        assert.strictEqual(result,null);
                    })
                    .call(done);
            });

            it('should create two cookies and delete all at once', function(done){
                client
                    .setCookie({name: 'test',value: 'cookie saved!'})
                    .setCookie({name: 'test2',value: 'cookie2 saved!'})
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
        });

        describe('test ability to go back and forward in browser history', function() {

            before(function(done) {
                client.url(testpageURL).call(done);
            });

            it('should be able to go backward in history', function(done){
                client
                    .getTitle(function(err,title) {
                        expect(err).to.be.null;
                        assert.strictEqual(title,testpageTitle);
                    })
                    .click('#githubRepo')
                    .getTitle(function(err,title) {
                        expect(err).to.be.null;
                        assert.strictEqual(title,githubTitle);
                    })
                    .back()
                    .getTitle(function(err,title) {
                        expect(err).to.be.null;
                        assert.strictEqual(title,testpageTitle);
                    })
                    .call(done);
            });

            it('should be able to go forward in history', function(done){
                client
                    .forward()
                    .waitFor('.teaser-illustration',5000)
                    .getTitle(function(err,title) {
                        expect(err).to.be.null;
                        assert.strictEqual(title,githubTitle);
                    })
                    .call(done);
            });

        });

        describe('click command test',function(done) {

            // TODO call URL in before function doesn't work, why?

            it('text should be visible after clicking on .btn1', function(done){
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
                    .call(done);
            });


            it('text should NOT be visible after click on .btn2 because button is disabled', function(done){
                client
                    .url(testpageURL)
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
                    .call(done);
            });


            it('text should NOT be visible after click on .btn3 because button is behind overlay', function(done){
                client
                    .url(testpageURL)
                    .isVisible('.btn3',function(err,result) {
                        expect(err).to.be.null;
                        if(result) {
                            client.click('.btn3',function(err,result) {
                                // phantomjs is able to click on a not clickable button
                                if(capabilities.browserName === 'phantomjs') {
                                    expect(err).to.be.null; 
                                    result.status.should.equal(0);
                                } else {
                                    expect(err).not.to.be.null; 
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
                    .call(done);
            });


            it('text should be visible after clicking ion .btn4 with a width/height of 0', function(done){
                client
                    .url(testpageURL)
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
                        assert(result, '.btn4 was clicked');
                    })
                    .call(done);
            });

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
            client.url(testpageURL).pause(1000);

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

        describe('test submit button with click and submitForm', function(done) {

            var elementShouldBeNotFound = function(err,result) {
                err.should.not.equal.null;
                // for phantomjs it is an UnknownError instead of NoSuchElement in Browser
                assert.strictEqual(result.status, capabilities.browserName === 'phantomjs' ? 13 : 7);
            };
            var elementShouldBeVisible = function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result,true);
            };
            var shouldCauseNoError = function(err) {
                expect(err).to.be.null;
            };

            it('click on submit button should send data from form', function(done) {
                client
                    .url(testpageURL)
                    .isVisible('.gotDataA', elementShouldBeNotFound)
                    .isVisible('.gotDataB', elementShouldBeNotFound)
                    .isVisible('.gotDataC', elementShouldBeNotFound)
                    .click('.send',         shouldCauseNoError)
                    .isVisible('.gotDataA', elementShouldBeVisible)
                    .isVisible('.gotDataB', elementShouldBeVisible)
                    .isVisible('.gotDataC', elementShouldBeVisible)
                    .call(done);
            });

            it('submit form via provided command should send data from form', function(done) {
                client
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
                    delta.should.be.within(2999,10000);
                    done();
                });

        });

        it.skip('closeAll ends all sessions', function(done) {

            var client1 = webdriverjs.remote({logLevel:'silent',desiredCapabilities:capabilities}).init();
            var client2 = webdriverjs.remote({logLevel:'silent',desiredCapabilities:capabilities}).init();

            client1.url(testpageURL).call(function() {
                client2.url(testpageURL).call(function() {
                    webdriverjs.sessions(function(err, sessions) {
                        should.not.exist(err);
                        sessions.should.have.lengthOf(2);
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


    });

    after(function() {
        client.end();
    });

});
