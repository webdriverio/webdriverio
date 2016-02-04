var page = require('./page')

var dynamicPage = Object.create(page, {
    /**
     * define elements
     */
    btnStart:   { get: function () { return browser.element('button=Start'); } },
    loadedPage: { get: function () { return browser.elements('#finish'); } },

    /**
     * define or overwrite page methods
     */
    open: { value: function() {
        page.open.call(this, 'dynamic_loading/2');
    } }
});

module.exports = dynamicPage
