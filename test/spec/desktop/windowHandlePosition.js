describe('windowHandlePosition', function() {

    before(h.setup());

    var check = function(res) {
        res.value.x.should.be.above(process.env.TRAVIS ? -9 : 1);
        res.value.y.should.be.above(process.env.TRAVIS ? -9 : 1);
    };

    it('should return window position of specified window', function() {
        // use current tab id as a valid one
        return this.client.getCurrentTabId().then(function(tabid) {
            return this.windowHandlePosition(tabid).then(check);
        });
    });

    it('should return window position of current window', function() {
        return this.client.windowHandlePosition().then(check);
    });

    it('should change window position of specified window', function() {
        // use current tab id as a valid one
        return this.client.getCurrentTabId().then(function(tabid) {
            // specified window
            return this.windowHandlePosition(tabid, {x: 300, y: 150}).windowHandlePosition(tabid).then(function(res) {
                res.value.x.should.be.exactly(300);
                res.value.y.should.be.exactly(150);
            });
        });
    });

    it('should change window position of current window', function() {
        // use current tab id as a valid one
        return this.client.windowHandlePosition({x: 400, y: 250}).windowHandlePosition().then(function(res) {
            res.value.x.should.be.exactly(400);
            res.value.y.should.be.exactly(250);
        });
    });

});