
const Launcher = require('./src/launcher');
const Service = require('./src/service');

// detect if wdio-ui5-service is loaded by wdio config or manually injected
const runStandalone = !module.parent.parent.filename.includes("ConfigParser");
// detect if wdio-ui5-service is laoded by WDI5
const runByWDI5 = !module.parent.parent.filename.includes("wdi5.service.js");
const isWDIOService = runStandalone && runByWDI5;

if (isWDIOService) {
    // TODO: for wdio config utility PR
    module.exports = {
        default: Service,
        launcher: Launcher
    }
} else {
    module.exports = new Service();
}
