describe('setViewportSize/getViewportSize', function() {
    before(h.setup());

    beforeEach(function() {
        return this.client.windowHandleSize({
            width: 500,
            height: 500
        });
    })

    it('should change viewport size of current window and should return the exact value', function() {
        return this.client.setViewportSize({
            width: 700,
            height: 700
        }, true).getViewportSize().then(function(size) {
            size.width.should.be.exactly(700);
            size.height.should.be.exactly(700);
        });
    });

    it('should set window size exactly when parameter \'type\' is true by default', function() {
        return this.client.setViewportSize({
            width: 700,
            height: 700
        }).getViewportSize().then(function(size) {
            size.width.should.be.exactly(700);
            size.height.should.be.exactly(700);
        }).windowHandleSize().then(function(res) {
            res.value.width.should.be.exactly(700);
            res.value.height.should.be.greaterThan(700);
        });
    });

    it('should let windowHandleSize return bigger values since it includes menu and status bar heights', function() {
        return this.client.setViewportSize({
            width: 700,
            height: 700
        }, false).getViewportSize().then(function(size) {
            size.width.should.be.exactly(700);
            size.height.should.be.lessThan(700);
        }).windowHandleSize().then(function(res) {
            res.value.height.should.be.exactly(700);
        });
    });

});