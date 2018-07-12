import assert from 'assert'

import FormPage from '../pageobjects/form.page'

describe('auth form', () => {
    it('should deny access with wrong creds', () => {
        FormPage.open()
        FormPage.username.addValue('foo')
        FormPage.password.addValue('bar')
        FormPage.submit()

        assert.ok(FormPage.flash.getText().includes('Your username is invalid!'))
    })

    it('should allow access with correct creds', () => {
        FormPage.open()
        FormPage.username.addValue('tomsmith')
        FormPage.password.addValue('SuperSecretPassword!')
        FormPage.submit()

        FormPage.flash.waitForVisible()
        assert.ok(FormPage.flash.getText().includes('You logged into a secure area!'))
    })
})
