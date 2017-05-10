var page = require('./page');

var checkboxPage = Object.create(page, {
    /**
     * define elements
     */
    lastCheckbox:  { get: function () { return $('#checkboxes input:last-Child'); } },
    firstCheckbox: { get: function () { return $('#checkboxes input:first-Child'); } },

    /**
     * define or overwrite page methods
     */
    open: { value: function() {
        page.open.call(this, 'checkboxes');
    } }
});

module.exports = checkboxPage;
