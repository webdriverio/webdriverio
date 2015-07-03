/*jshint expr: true*/
describe('isSelected', function() {

    before(h.setup());

    it('should check if a single checkbox element is selected', function() {
        return this.client.isSelected('.checkbox_selected').then(function (isSelected) {
            isSelected.should.be.true;
        })
        .isSelected('.checkbox_notselected').then(function (isSelected) {
            isSelected.should.be.false;
        });
    });

    it('should check multiple checkbox elements are selected', function() {
        return this.client.isSelected('[name="checkbox"]').then(function (isSelected) {
            isSelected.should.be.an.instanceOf(Array);
            isSelected.should.have.length(2);
            isSelected.should.containEql(true);
            isSelected.should.containEql(false);
        });
    });

    it('should check if a single radio element is selected', function() {
        return this.client.isSelected('.radio_selected').then(function (isSelected) {
            isSelected.should.be.true;
        })
        .isSelected('.radio_notselected').then(function (isSelected) {
            isSelected.should.be.false;
        });
    });

    it('should check multiple radio elements are selected', function() {
        return this.client.isSelected('[name="radio"]').then(function (isSelected) {
            isSelected.should.be.an.instanceOf(Array);
            isSelected.should.have.length(2);
            isSelected.should.containEql(true);
            isSelected.should.containEql(false);
        });
    });

});