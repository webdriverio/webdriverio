describe('click command test',function() {

    var testClickMethodAlias = function(clickMethodName) {

        var clickAndConfirm = function(params) {
            var checkClickResult = function(err, result) {
                assert.equal(err, null);
                assert.equal(result.status, 0);
            };

            params.client
                .isVisible(params.btnClass, function(err,result) {
                    assert.equal(err, null);
                    assert.ok(result);
                })
                .isVisible(params.confirmationClass, function(err, result) {
                    assert.equal(err, null);
                    assert.ok(!result, 'confirmation must be invisible as a precondition');
                });

            if(params.buttonSpecified) {
                params.client[clickMethodName](params.btnClass, params.button, checkClickResult);
            } else {
                params.client[clickMethodName](params.btnClass, checkClickResult);
            }

            params.client
                .isVisible(params.confirmationClass, function(err, result) {
                    assert.equal(err, null);
                    assert.equal(result, params.expectConfirmationVisible,
                        'expectation failed on ' + params.btnClass + ' being clicked');
                });
        };

        beforeEach(h.setup);

        it('text should be visible after click on .btn1', function(done){
            clickAndConfirm({
                client: this.client,
                btnClass: '.btn1',
                confirmationClass: '.btn1_clicked',
                expectConfirmationVisible: true,
            });
            this.client.call(done);
        });

        it('text should NOT be visible after click on .btn2 because button is disabled', function(done){
            clickAndConfirm({
                client: this.client,
                btnClass: '.btn2',
                confirmationClass: '.btn2_clicked',
                expectConfirmationVisible: false,
            });
            this.client.call(done);
        });

        it('text should be visible after click on .btn3 altought it is behind an overlay', function(done){
            clickAndConfirm({
                client: this.client,
                btnClass: '.btn3',
                confirmationClass: '.btn3_clicked',
                expectConfirmationVisible: true,
            });
            this.client.call(done);
        });


        it('text should be visible after clicking on .btn4 1px/1px width/height', function(done){
            clickAndConfirm({
                client: this.client,
                btnClass: '.btn4',
                confirmationClass: '.btn4_clicked',
                expectConfirmationVisible: true,
            });
            this.client.call(done);
        });

        describe('/session/:sessionId/click protocol', function() {

            it('text should be visible after click on .btn1 with left button', function(done) {
                clickAndConfirm({
                    client: this.client,
                    btnClass: '.btn1',
                    confirmationClass: '.btn1_clicked',
                    buttonSpecified: true,
                    button: 'left',
                    expectConfirmationVisible: true,
                });
                this.client.call(done);
            });

            it('text should be visible after click on .btn1 with undefined button', function(done) {
                clickAndConfirm({
                    client: this.client,
                    btnClass: '.btn1',
                    confirmationClass: '.btn1_clicked',
                    buttonSpecified: true,
                    button: undefined,
                    expectConfirmationVisible: true,
                });
                this.client.call(done);
            });

            // note this fails with most browsers: middle click becomes left click.
            it.skip('text should be visible after middle-clicking on .btn1', function(done) {
                clickAndConfirm({
                    client: this.client,
                    btnClass: '.btn1',
                    confirmationClass: '.btn1_middle_clicked',
                    buttonSpecified: true,
                    button: 'middle',
                    expectConfirmationVisible: true,
                });
                this.client.call(done);
            });

            it('text should be visible after right-clicking on .btn1', function(done) {
                clickAndConfirm({
                    client: this.client,
                    btnClass: '.btn1',
                    confirmationClass: '.btn1_right_clicked',
                    buttonSpecified: true,
                    button: 'right',
                    expectConfirmationVisible: true,
                });
                this.client
                    // For some reason, in Chrome, right clicking again makes the context menu disappear.
                    // This is only for cosmetics; letting the menu remain doesn't affect the rest of the tests.
                    .buttonPress('right')
                    .call(done);
            });
        });
    };

    describe('command `click`', function() {
        testClickMethodAlias.call(this, 'click');
    });

    describe('legacy command `buttonClick`', function() {
        testClickMethodAlias.call(this, 'buttonClick');
    });

});
