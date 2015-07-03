/*jshint expr: true*/
describe('rightclick', function() {

    before(h.setup());

    it('text should be visible after right-clicking on .btn1', function() {
        return this.client.isVisible('.btn1_right_clicked').then(function(isVisible) {
            isVisible.should.be.false;
        }).rightClick('.btn1').isVisible('.btn1_right_clicked').then(function(isVisible) {
            isVisible.should.be.true;
        });
    });

});