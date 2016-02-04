var page = require('./page')

var checkboxPage = Object.create(page, {
    /**
     * define elements
     */
    lastCheckbox:  { get: function () { return browser.element('#checkboxes input:last-Child'); } },
    firstCheckbox: { get: function () { return browser.element('#checkboxes input:first-Child'); } },

    /**
     * define or overwrite page methods
     */
    open: { value: function() {
        page.open.call(this, 'checkboxes');
    } }
});

module.exports = checkboxPage
