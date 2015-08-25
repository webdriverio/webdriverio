describe('setViewportSize/getViewportSize', function() {
    before(h.setup());

    beforeEach(function() {
        return this.client.windowHandleSize({
            width: 600,
            height: 600
        });
    })

    it('should change viewport size of current window and should return the exact value', function() {
        return this.client.setViewportSize({
            width: 800,
            height: 800
        }, true)
        .pause(2000) // give the browser time to resize
        .getViewportSize().then(function(size) {
            size.width.should.be.exactly(800);
            size.height.should.be.exactly(800);
        });
    });

    it('should set window size exactly when parameter \'type\' is true by default', function() {
        return this.client.setViewportSize({
            width: 800,
            height: 800
        })
        .pause(2000) // give the browser time to resize
        .getViewportSize().then(function(size) {
            size.width.should.be.exactly(800);
            size.height.should.be.exactly(800);
        }).windowHandleSize().then(function(res) {
            res.value.width.should.be.exactly(800);
            res.value.height.should.be.greaterThan(800);
        });
    });

    it('should let windowHandleSize return bigger values since it includes menu and status bar heights', function() {
        return this.client.setViewportSize({
            width: 800,
            height: 800
        }, false)
        .pause(2000) // give the browser time to resize
        .getViewportSize().then(function(size) {
            size.width.should.be.exactly(800);
            size.height.should.be.lessThan(800);
        }).windowHandleSize().then(function(res) {
            res.value.height.should.be.exactly(800);
        });
    });

});