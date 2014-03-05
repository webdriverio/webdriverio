module.exports = function init (desiredCapabilities, callback) {
    var merge = require('deepmerge');

    var commandOptions = {
        path:"/session",
        method:"POST"
    };

    if (typeof desiredCapabilities == "function") {
        callback = desiredCapabilities;
        desiredCapabilities = null;
    } else {
        this.desiredCapabilities = merge(this.desiredCapabilities, desiredCapabilities);
        if (desiredCapabilities.sessionId) {
            this.sessionId = desiredCapabilities.sessionId;
        }
    }

    this.requestHandler.create(
        commandOptions,
        {desiredCapabilities:this.desiredCapabilities},
        callback
    );

};