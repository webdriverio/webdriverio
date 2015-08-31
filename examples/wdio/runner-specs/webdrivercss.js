describe('wdio plugin test', function() {

    it('should take a screenshot using WebdriverCSS', function(done) {

        browser
            .url('/') // baseUrl points to github.com
            .webdrivercss('github', [{
                name: 'header',
                elem: 'div.header'
            }, {
                name: 'signup',
                elem: '.form-signup-home'
            }])
            .call(done);

    });

});