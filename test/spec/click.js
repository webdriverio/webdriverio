var clickAndConfirm = function(params) {
    params.client
        .isVisible(params.btnClass, function(err,result) {
            assert.equal(err, null);
            assert.ok(result);
        })
        .isVisible(params.confirmationClass, function(err, result) {
            assert.equal(err, null);
            assert.ok(!result, 'confirmation must be invisible as a precondition');
        })
        [params.clickMethodName](params.btnClass, function(err, result) {
            assert.equal(err, null);
            assert.equal(result.status, 0);
        })
        .isVisible(params.confirmationClass, function(err, result) {
            assert.equal(err, null);
            assert.equal(result, params.expectConfirmationVisible,
                'expectation failed on ' + params.btnClass + ' being clicked');
        });
};


describe('left click commands',function() {

    var testMouseClick = function(clickMethodName) {

        it('text should be visible after click on .btn1', function(done){
            clickAndConfirm({
                client: this.client,
                clickMethodName: clickMethodName,
                btnClass: '.btn1',
                confirmationClass: '.btn1_clicked',
                expectConfirmationVisible: true,
            });
            this.client.call(done);
        });

        it('text should NOT be visible after click on .btn2 because button is disabled', function(done){
            clickAndConfirm({
                client: this.client,
                clickMethodName: clickMethodName,
                btnClass: '.btn2',
                confirmationClass: '.btn2_clicked',
                expectConfirmationVisible: false,
            });
            this.client.call(done);
        });


        it('text should be visible after clicking on .btn4 1px/1px width/height', function(done){
            clickAndConfirm({
                client: this.client,
                clickMethodName: clickMethodName,
                btnClass: '.btn4',
                confirmationClass: '.btn4_clicked',
                expectConfirmationVisible: true,
            });
            this.client.call(done);
        });

    };

    var testEventClick = function(clickMethodName) {
        it('text should be visible after click on .btn3 altought it is behind an overlay', function(done){
            clickAndConfirm({
                client: this.client,
                clickMethodName: clickMethodName,
                btnClass: '.btn3',
                confirmationClass: '.btn3_clicked',
                expectConfirmationVisible: true,
            });
            this.client.call(done);
        });
    };

    beforeEach(h.setup);

    describe('mouse button click', function() {
        ['click', 'buttonClick', 'leftClick'].forEach(function(clickMethodName) {
            describe('`' + clickMethodName + '`', function() {
                testMouseClick(clickMethodName);
            });
        });
    });

    describe('click command can directly invoke click event', function() {
        ['click', 'buttonClick'].forEach(function(clickMethodName) {
            describe('`' + clickMethodName + '`', function() {
                testEventClick(clickMethodName);
            });
        });
    });

});

describe('non-left clicks', function() {
    before(h.setup);

    // note this fails with most browsers: middle click becomes left click.
    it.skip('text should be visible after middle-clicking on .btn1', function(done) {
        clickAndConfirm({
            client: this.client,
            clickMethodName: 'middleClick',
            btnClass: '.btn1',
            confirmationClass: '.btn1_middle_clicked',
            expectConfirmationVisible: true,
        });
        this.client.call(done);
    });

    it('text should be visible after right-clicking on .btn1', function(done) {
        clickAndConfirm({
            client: this.client,
            clickMethodName: 'rightClick',
            btnClass: '.btn1',
            confirmationClass: '.btn1_right_clicked',
            expectConfirmationVisible: true,
        });
        this.client.call(done);
    });
});
