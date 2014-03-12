var clickAndConfirm = function(params) {
    params.client
        .isVisible(params.btnClass, function(err,result) {
            assert.equal(err, null);
            assert.ok(result);
        })
        .isVisible(params.confirmationClass, function(err, result) {
            assert.equal(err, null);
            assert.ok(!result, 'confirmation must be invisible as a precondition');
        });

    if(params.moveBeforeClick) {
        params.client
            .moveToObject(params.btnClass, function(err, result) {
                assert.equal(err, null);
            })
            [params.clickMethodName](function(err, result) {
                assert.equal(err, null);
                assert.equal(result.status, 0);
            });
    } else {
        params.client
            [params.clickMethodName](params.btnClass, function(err, result) {
                assert.equal(err, null);
                assert.equal(result.status, 0);
            });
    }

    params.client
        .isVisible(params.confirmationClass, function(err, result) {
            assert.equal(err, null);
            assert.equal(result, params.expectConfirmationVisible);
        });
};


describe('left click commands',function() {

    var testMouseClick = function(clickMethodName, moveBeforeClick) {

        it('text should be visible after click on .btn1', function(done){
            clickAndConfirm({
                client: this.client,
                clickMethodName: clickMethodName,
                moveBeforeClick: moveBeforeClick,
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
                moveBeforeClick: moveBeforeClick,
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
                moveBeforeClick: moveBeforeClick,
                btnClass: '.btn4',
                confirmationClass: '.btn4_clicked',
                expectConfirmationVisible: true,
            });
            this.client.call(done);
        });

    };

    beforeEach(h.setup);

    ['click', 'buttonClick'].forEach(function(clickMethodName) {
        describe('`' + clickMethodName + '`', function() {
            testMouseClick(clickMethodName);
        });
    });

    describe('`leftClick`', function() {
        testMouseClick('leftClick');
        testMouseClick('leftClick', true);
    });

});

describe('rightclick', function() {
    before(h.setup);

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

describe.skip('middleClick', function() {
    before(h.setup);

    // note this fails with most browsers: middle click becomes left click.
    it('text should be visible after middle-clicking on .btn1', function(done) {
        clickAndConfirm({
            client: this.client,
            clickMethodName: 'middleClick',
            btnClass: '.btn1',
            confirmationClass: '.btn1_middle_clicked',
            expectConfirmationVisible: true,
        });
        this.client.call(done);
    });
});
