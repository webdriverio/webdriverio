var page = require('./page')

var formPage = Object.create(page, {
    /**
     * define elements
     */
    username: { get: function () { return browser.elements('#username'); } },
    password: { get: function () { return browser.elements('#password'); } },
    form:     { get: function () { return browser.elements('#login'); } },
    flash:    { get: function () { return browser.elements('#flash'); } },

    /**
     * define or overwrite page methods
     */
    open: { value: function() {
        page.open.call(this, 'login');
    } },

    submit: { value: function() {
        this.form.submitForm();
    } }
});

module.exports = formPage
