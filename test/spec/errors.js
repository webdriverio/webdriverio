describe('webdriverjs errors', function() {
    before(h.setup);

    it('are real `Error` objects', function(done) {
        this.client.element('SOMETHING NOT AVAILABLE', function(err) {
            assert.ok(err instanceof Error);
            done();
        })
    });

    it('are detailed', function(done) {
        this.client.element('.not-available-selector', function(err) {
            assert.ok(/^\[element\("\.not-available-selector"\)\] <=/.test(err.message))
            done();
        })
    });
});