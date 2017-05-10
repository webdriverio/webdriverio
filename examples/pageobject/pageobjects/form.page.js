var page = require('./page');

var formPage = Object.create(page, {
    /**
     * define elements
     */
    username: { get: function () { return $('#username'); } },
    password: { get: function () { return $('#password'); } },
    form:     { get: function () { return $('#login'); } },
    flash:    { get: function () { return $('#flash'); } },

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

module.exports = formPage;
