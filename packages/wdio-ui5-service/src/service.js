// The rest of the hooks will be handled by the service (the default export), as normal.

const SevereServiceError = require('webdriverio')
const wdioUI5 = require('./lib/wdioUi5-index');

module.exports = class Service {

    before(capabilities, specs) {

        // call the start function
        this.startWDI5()
    };

    /**
     * separate the start funtion for felxibility
     */
    startWDI5() {

        // UI5 bridge setup
        const context = driver ? driver : browser;
        const wdi5config = context.config.wdi5;

        // this is only to run in browser
        if (wdi5config && wdi5config.url) {
            browser.url(wdi5config.url);
        }

        console.log("wdio-ui5-service before hook")

        wdioUI5.setup(context); // use wdio hooks for setting up wdio<->ui5 bridge

        // returns promise
        let status = wdioUI5.checkForUI5Page();
        status.then(() => {
            wdioUI5.injectUI5(context); // needed to let the instance know that UI5 is now available for work
        })
    }

    after(result, capabilities, specs) {

    };
}

