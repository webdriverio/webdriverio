/*jshint expr: true*/
describe('click', function() {

    before(h.setup());

    it('text should be visible after clicking on .btn1', function() {
        return this.client.isVisible('//html/body/section/div[7]').then(function (isVisible) {
            isVisible.should.be.false;
        })
        .click('//html/body/section/button[1]')
        .isVisible('//html/body/section/div[7]').then(function (isVisible) {
            isVisible.should.be.true;
        });
    });

});