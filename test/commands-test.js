var assert = require("assert"),
    webdriverjs = require("../index"),
    githubTitle = 'GitHub · Build software better, together.',
    githubRepoTitle = 'Camme/webdriverjs · GitHub';

describe('test webdriverjs API', function(){

    this.timeout(99999999);

    var client = {};

    before(function(){
        // init client
        var capabilities =  {
            'browserName': 'safari',
            // 'safari.binary': '/Applications/Safari.app/Contents/MacOS/Safari'
        };
        client = webdriverjs.remote({desiredCapabilities:capabilities});
    });

    beforeEach(function(){
        client
            .init()
            .url('https://github.com/Camme/webdriverjs');
    });

    describe('test commands', function(){
        it('get commands should return the evaluated value', function(done){
            client
                .getElementCssProperty('id', 'footer', 'color', function(result) {
                    assert('rgba(119,119,119,1)' === result.replace(/\s+/g, ''));
                })
                .getCssProperty('#footer', 'color', function(result) {
                    assert('rgba(119,119,119,1)' === result.replace(/\s+/g, ''));
                })
                .getElementCssProperty('class name', 'repo-label', 'text-transform', function(result) {
                    assert('uppercase' === result);
                })
                .getCssProperty('.repo-label', 'text-transform', function(result) {
                    assert('uppercase' === result);
                })
                .getElementCssProperty('id', 'js-repo-pjax-container', 'width', function(result) {
                    assert('920px' === result);
                })
                .getCssProperty('.container', 'width', function(result) {
                    assert('920px' === result);
                })
                .end(done);
        });

        it.only('back button should return to the previous page', function(done) {
            client
                .getTitle(function(title) {
                    assert(title === githubRepoTitle);
                })
                .click('.header-logo-wordmark')
                // waitFor fix, to get safari a little bit more time to load
                .waitFor('.teaser-illustration',5000)
                .getTitle(function(title) {
                    assert(title === githubTitle);
                })
                .back()
                // waitFor fix, to get safari a little bit more time to load
                .waitFor('.public',5000)
                .getTitle(function(title) {
                    assert(title === githubRepoTitle);
                })
                .forward()
                .waitFor('.teaser-illustration',5000)
                .getTitle(function(title) {
                    assert(title === githubTitle);
                })
                .end(done);
        });
    });
});