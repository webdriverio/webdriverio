var expect = require('chai').expect;
var FormPage = require('../pageobjects/form.page');

describe('auth form', function () {
    it('should deny access with wrong creds', function () {
        FormPage.open();
        FormPage.username.setValue('foo');
        FormPage.password.setValue('bar');
        FormPage.submit();

        expect(FormPage.flash.getText()).to.contain('Your username is invalid!');
    });

    it('should allow access with correct creds', function () {
        FormPage.open();
        FormPage.username.setValue('tomsmith');
        FormPage.password.setValue('SuperSecretPassword!');
        FormPage.submit();

        expect(FormPage.flash.getText()).to.contain('You logged into a secure area!');
    });
});
