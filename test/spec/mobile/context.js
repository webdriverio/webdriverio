describe('context', function() {

    before(h.setup());

    it('should return available context modes', function() {
        return this.client.context().then(function(context) {
            context.value.should.be.exactly('WEBVIEW_1');
        });
    });

});