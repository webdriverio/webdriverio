/*jshint expr: true*/
describe('isSelected', function() {

    before(h.setup());

    it('should check if a single checkbox element is selected', function(done) {
        this.client
            .isSelected('.checkbox_selected', function(err, isSelected) {
                assert.equal(err, null);
                isSelected.should.be.true;
            })
            .isSelected('.checkbox_notselected', function(err, isSelected) {
                assert.equal(err, null);
                isSelected.should.be.false;
            })
            .call(done);
    });

    it('should check multiple checkbox elements are selected', function(done) {
        this.client
            .isSelected('[name="checkbox"]', function(err, isSelected) {
                assert.equal(err, null);
                isSelected.should.be.an.instanceOf(Array);
                isSelected.should.have.length(2);
                isSelected.should.containEql(true);
                isSelected.should.containEql(false);
            })
            .call(done);
    });

    it('should check if a single radio element is selected', function(done) {
        this.client
            .isSelected('.radio_selected', function(err, isSelected) {
                assert.equal(err, null);
                isSelected.should.be.true;
            })
            .isSelected('.radio_notselected', function(err, isSelected) {
                assert.equal(err, null);
                isSelected.should.be.false;
            })
            .call(done);
    });

    it('should check multiple radio elements are selected', function(done) {
        this.client
            .isSelected('[name="radio"]', function(err, isSelected) {
                assert.equal(err, null);
                isSelected.should.be.an.instanceOf(Array);
                isSelected.should.have.length(2);
                isSelected.should.containEql(true);
                isSelected.should.containEql(false);
            })
            .call(done);
    });

});