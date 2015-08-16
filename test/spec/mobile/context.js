describe('context', function() {

    before(h.setup());

    it('should return the current context mode', function() {
        return this.client.context().then(function(context) {
            context.value.should.be.exactly('WEBVIEW_1');
        });
    });

    it('should return all available context modes', function() {
      return this.client.contexts().then(function(contexts) {
        contexts.value.should.have.length(2);
      });
    });

});