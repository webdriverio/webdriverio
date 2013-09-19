/* jshint -W024 */
/* jshint expr:true */

var packageJson    = require('../package.json'),
    chai           = require('chai'),
    assert         = chai.assert,
    should         = chai.should(),
    expect         = chai.expect;
    fs             = require('fs'),
    request        = require('request'),
    webdriverjs    = require('../index'),
    testpageURL    = 'http://webdriverjs.christian-bromann.com/',
    githubTitle    = 'GitHub · Build software better, together.',
    testpageTitle  = 'WebdriverJS Testpage',
    testpageSource = "";

// test capabilities
var capabilities   = {
    browserName: 'chrome',
    version: '27',
    platform: 'XP',
    tags: ['webdriverjs','api','test'],
    name: 'webdriverjs API test',
    build: process.env.TRAVIS_BUILD_NUMBER ? 'build' + process.env.TRAVIS_BUILD_NUMBER : new Date().getTime(),
    username: process.env.SAUCE_USERNAME,
    accessKey: process.env.SAUCE_ACCESS_KEY,
    'record-video': false,
    'record-screenshots': false
};

describe('webdriverjs API test', function(){

    var client = {};

    before(function(done){

        // init client
        client = webdriverjs.remote({
            desiredCapabilities:capabilities,
            logLevel: 'silent',
            host: 'ondemand.saucelabs.com',
            port: 80
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
                    assert.strictEqual(result,'text-transform: uppercase;');
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


            it('text should be visible after click on .btn3 although button is behind overlay', function(done){
                client
                    .url(testpageURL)
                    .isVisible('.btn3',function(err,result) {
                        expect(err).to.be.null;
                        if(result) {
                            client.click('.btn3',function(err,result) {
                                expect(err).to.be.null;
                                result.status.should.equal(0);
                            });
                        }
                    })
                    .isVisible('.btn3_clicked',function(err,result){
                        expect(err).to.be.null;
                        assert(result, '.btn3 wasn\'t clicked');
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

        describe('buttonClick command test',function(done) {

            // TODO call URL in before function doesn't work, why?

            it('text should be visible after click on .btn1', function(done){
                client
                    .url(testpageURL)
                    .isVisible('.btn1',function(err,result) {
                        expect(err).to.be.null;
                        if(result) {
                            client.buttonClick('.btn1',function(err,result) {
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
                            client.buttonClick('.btn2',function(err,result) {
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


            it('text should not be visible after click on .btn3 because button is behind overlay', function(done){
                client
                    .url(testpageURL)
                    .isVisible('.btn3',function(err,result) {
                        expect(err).to.be.null;
                        if(result) {
                            client.buttonClick('.btn3',function(err,result) {
                                expect(err).to.be.null;
                                result.status.should.equal(0);
                            });
                        }
                    })
                    .isVisible('.btn3_clicked',function(err,result){
                        expect(err).to.be.null;
                        assert(!result, '.btn3 was clicked');
                    })
                    .call(done);
            });


            it('text should be visible after clicking ion .btn4 with a width/height of 0', function(done){
                client
                    .url(testpageURL)
                    .isVisible('.btn4',function(err,result) {
                        expect(err).to.be.null;
                        if(result) {
                            client.buttonClick('.btn4',function(err,result) {
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

        describe('doubleClick command test',function(done) {

            // TODO call URL in before function doesn't work, why?

            it('text should be visible after doubleClick on .btn1', function(done){
                client
                    .url(testpageURL)
                    .isVisible('.btn1',function(err,result) {
                        expect(err).to.be.null;
                        if(result) {
                            client.doubleClick('.btn1',function(err,result) {
                                expect(err).to.be.null;
                                result.status.should.equal(0);
                            });
                        }
                    })
                    .isVisible('.btn1_dblclicked',function(err,result){
                        expect(err).to.be.null;
                        assert(result, '.btn1 was doubleClicked');
                    })
                    .call(done);
            });


            it('text should NOT be visible after doubleClick on .btn2 because button is disabled', function(done){
                client
                    .url(testpageURL)
                    .isVisible('.btn2',function(err,result) {
                        expect(err).to.be.null;
                        if(result) {
                            client.doubleClick('.btn2',function(err,result) {
                                expect(err).to.be.null;
                                result.status.should.equal(0);
                            });
                        }
                    })
                    .isVisible('.btn2_dblclicked',function(err,result){
                        expect(err).to.be.null;
                        assert(!result, '.btn2 wasn\'t doubleClicked');
                    })
                    .call(done);
            });


            it('text should not be visible after doubleClick on .btn3 because button is behind overlay', function(done){
                client
                    .url(testpageURL)
                    .isVisible('.btn3',function(err,result) {
                        expect(err).to.be.null;
                        if(result) {
                            client.doubleClick('.btn3',function(err,result) {
                                expect(err).to.be.null;
                                result.status.should.equal(0);
                            });
                        }
                    })
                    .isVisible('.btn3_dblclicked',function(err,result){
                        expect(err).to.be.null;
                        assert(!result, '.btn3 was doubleClicked');
                    })
                    .call(done);
            });


            it('text should be visible after doubleClicking ion .btn4 with a width/height of 0', function(done){
                client
                    .url(testpageURL)
                    .isVisible('.btn4',function(err,result) {
                        expect(err).to.be.null;
                        if(result) {
                            client.doubleClick('.btn4',function(err,result) {
                                expect(err).to.be.null;
                                result.status.should.equal(0);
                            });
                        }
                    })
                    .isVisible('.btn4_dblclicked',function(err,result){
                        expect(err).to.be.null;

                        // it is possible to click on a button with width/height = 0
                        assert(result, '.btn4 was doubleClicked');
                    })
                    .call(done);
            });

        });

        // skip test until further execution chain improvements
        describe.skip('drag&drop command test', function() {

            it('should drag and drop the overlay without an error', function(done) {
                client
                    .url(testpageURL)
                    .dragAndDrop('#overlay','.red',function(err,result) {
                        expect(err).to.be.null;
                        result.status.should.equal(0);
                    })
                    .call(done);
            });

            it('should be able to click on .btn3 because the overlay is gone now', function(done) {
                client
                    .isVisible('.btn3',function(err,result) {
                        expect(err).to.be.null;
                        if(result) {
                            client.buttonClick('.btn3',function(err,result) {
                                expect(err).to.be.null;
                                result.status.should.equal(0);
                            });
                        }
                    })
                    .isVisible('.btn3_dblclicked',function(err,result){
                        expect(err).to.be.null;
                        assert(result, '.btn3 was not clicked');
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
                assert.strictEqual(result,'3');
            };

            for(var i = 0; i < 3; ++i) {
                client
                    .setValue('input.searchinput','0', checkError)
                    .setValue('input.searchinput','1', checkError)
                    .setValue('input.searchinput','2', checkError)
                    .setValue('input.searchinput','3', checkError)
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
                assert.strictEqual(result,'0123');
            };

            for(var i = 0; i < 3; ++i) {
                client
                    .addValue('input.searchinput','0', checkError)
                    .addValue('input.searchinput','1', checkError)
                    .addValue('input.searchinput','2', checkError)
                    .addValue('input.searchinput','3', checkError)
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

        describe('test unicode characters', function() {

            var checkError = function(err) {
                expect(err).to.be.null;
            };

            it('input should have an empty value after using delete command', function(done) {
                client
                    .url(testpageURL)
                    .addValue('input.searchinput','012', checkError)
                    .addValue('input.searchinput','Left arrow', checkError)
                    .addValue('input.searchinput','Left arrow', checkError)
                    .addValue('input.searchinput','Left arrow', checkError)
                    .addValue('input.searchinput','Delete', checkError)
                    .addValue('input.searchinput','Delete', checkError)
                    .addValue('input.searchinput','Delete', checkError)
                    .getValue('input.searchinput', function(err,value) {
                        expect(err).to.be.null;
                        assert.strictEqual(value,'');
                    })
                    .call(done);
            });

            it('input should have an empty value after using Back space command', function(done) {
                client
                    .url(testpageURL)
                    .addValue('input.searchinput','012', checkError)
                    .addValue('input.searchinput','Back space', checkError)
                    .addValue('input.searchinput','Back space', checkError)
                    .addValue('input.searchinput','Back space', checkError)
                    .getValue('input.searchinput', function(err,value) {
                        expect(err).to.be.null;
                        assert.strictEqual(value,'');
                    })
                    .call(done);
            });

            it('input should have one space as input', function(done) {
                client
                    .url(testpageURL)
                    .addValue('input.searchinput','Space', checkError)
                    .getValue('input.searchinput', function(err,value) {
                        expect(err).to.be.null;
                        assert.strictEqual(value,' ');
                    })
                    .call(done);
            });

            it('input should contains contain special characters created by modifier keys (Shift|Alt)', function(done) {
                client
                    .url(testpageURL)
                    // to release the modifier a 'NULL' has to encounter, if not it should be held down
                    .setValue('input.searchinput',['Shift','1','NULL','Shift','2','3','4','NULL','Shift','5','6','NULL','Shift','7','NULL','Shift','8','9','0'], function(err){
                        expect(err).to.be.null;
                    })
                    .getValue('input.searchinput', function(err,res) {
                        expect(err).to.be.null;
                        // expect sepcial character according to american keyboard layout
                        assert.strictEqual(res,'!@#$%^&*()');
                    })
                    .call(done);
            });

            it('should add number characters via numpad', function(done) {
                client
                    .url(testpageURL)
                    .setValue('.searchinput',['Numpad 0','Numpad 1','Numpad 2','Numpad 3','Numpad 4','Numpad 5','Numpad 6','Numpad 7','Numpad 8','Numpad 9'], function(err) {
                        expect(err).to.be.null;
                    })
                    .getValue('.searchinput', function(err,res) {
                        expect(err).to.be.null;
                        assert.strictEqual(res,'0123456789');
                    })
                    .call(done);
            });

            it('it should cut&paste a text via Control + x and Control + v', function(done) {
                var text = 'test';

                client
                    .url(testpageURL)
                    // first set some text
                    .setValue('.searchinput',text,function(err) {
                        expect(err).to.be.null;
                    })
                    // mark text via shift + left arrow
                    .addValue('.searchinput',['Shift','Left arrow','Left arrow','Left arrow','Left arrow','NULL'], function(err) {
                        expect(err).to.be.null;
                    })
                    // cut text
                    .addValue('.searchinput',['Control','x','NULL'],function(err) {
                        expect(err).to.be.null;
                    })
                    // test: input field should be empty
                    .getValue('.searchinput',function(err,res) {
                        expect(err).to.be.null;
                        assert.strictEqual(res,'');
                    })
                    // paste value from clipboard
                    .addValue('.searchinput',['Control','v'],function(err) {
                        expect(err).to.be.null;
                    })
                    .getValue('.searchinput',function(err,res) {
                        expect(err).to.be.null;
                        assert.strictEqual(res,text);
                    })
                    .call(done);
            });

            it('it should copy&paste a text via Control + c and Control + v', function(done) {
                var text = 'test';

                client
                    .url(testpageURL)
                    // first set some text
                    .setValue('.searchinput',text,function(err) {
                        expect(err).to.be.null;
                    })
                    // mark text via shift + left arrow
                    .addValue('.searchinput',['Shift','Left arrow','Left arrow','Left arrow','Left arrow','NULL'], function(err) {
                        expect(err).to.be.null;
                    })
                    // copy text and move cursor to the end of the input field
                    .addValue('.searchinput',['Control','c','NULL','Right arrow'],function(err) {
                        expect(err).to.be.null;
                    })
                    // test: input field should contain test value
                    .getValue('.searchinput',function(err,res) {
                        expect(err).to.be.null;
                        assert.strictEqual(res,text);
                    })
                    // paste value from clipboard
                    .addValue('.searchinput',['Control','v'],function(err) {
                        expect(err).to.be.null;
                    })
                    .getValue('.searchinput',function(err,res) {
                        expect(err).to.be.null;
                        assert.strictEqual(res,text + text);
                    })
                    .call(done);
            });

            it('a new addValue command should release the modifier key', function(done) {
                client
                    .url(testpageURL)
                    .addValue('.searchinput',['Shift','1'],function(err) {
                        expect(err).to.be.null;
                    })
                    .addValue('.searchinput',['1'],function(err) {
                        expect(err).to.be.null;
                    })
                    .getValue('.searchinput',function(err,res) {
                        expect(err).to.be.null;
                        assert.strictEqual(res,'!1');
                    })
                    .call(done);
            });
        });

        it('should execute all commands in right order (asynchronous execution test)', function(done) {

            var result = '';

            client
                .url(testpageURL)
                .click('.btn1', function(err) {
                    expect(err).to.be.null;
                    result += '1';
                })
                .isVisible('.btn1', function(err) {
                    expect(err).to.be.null;
                    result += '2';
                })
                .call(function() {
                    result += '3';

                    client.click('.btn1',function(err) {
                        expect(err).to.be.null;
                        result += '4';

                        client.isVisible('.btn1', function(err) {
                            expect(err).to.be.null;
                            result += '5';
                        })
                        .call(function() {
                            result += '6';

                            client.call(function() {
                                result += '7';

                                client.doubleClick('.btn1', function(err) {
                                    expect(err).to.be.null;
                                    result += '8';

                                    client.call(function() {
                                        result += '9';

                                        client.isVisible('.btn1', function(err) {
                                            expect(err).to.be.null;
                                            result += '0';

                                            setTimeout(function() {
                                                client.call(function() {
                                                    result += 'a';
                                                });
                                            },1000);
                                        });
                                    });
                                })
                                .click('.btn1', function(err) {
                                    expect(err).to.be.null;
                                    result += 'b';
                                });
                            });
                        })
                        .click('.btn1', function() {
                            result += 'c';
                        })
                        .call(function() {
                            result += 'd';

                            client.isVisible('.btn1', function(err) {
                                expect(err).to.be.null;
                                result += 'e';
                            });
                        });
                    })
                    .buttonClick(function(err) {
                        expect(err).to.be.null;
                        result += 'f';
                    })
                    .call(function() {
                        assert(result,'1234567890abcdef');
                        done();
                    });
                });

        });

    });

    after(function(done) {

        // mark travis job as passed
        var options = {
            headers: { 'Content-Type': 'text/json' },
            url: 'http://' + process.env.SAUCE_USERNAME + ':' + process.env.SAUCE_ACCESS_KEY + '@saucelabs.com/rest/v1/' + process.env.SAUCE_USERNAME + '/jobs/' + client.requestHandler.sessionID,
            method: 'PUT',
            body: JSON.stringify({
                passed: true,
                public: true
            })
        };

        request(options, function(err) {
            
            if(err) {
                console.log(err);
                return;
            }

            client.end(done);

        });

    });

});
