var page = require('./page');

var dynamicPage = Object.create(page, {
    /**
     * define elements
     */
    btnStart:   { get: function () { return $('button=Start'); } },
    loadedPage: { get: function () { return $('#finish'); } },

    /**
     * define or overwrite page methods
     */
    open: { value: function() {
        page.open.call(this, 'dynamic_loading/2');
    } }
});

module.exports = dynamicPage;
