exports.command = function (desiredCapabilities, callback) {

    var commandOptions = {
        path:"/session",
        method:"POST"
    };

    if (typeof desiredCapabilities == "function") {
        callback = desiredCapabilities;
        desiredCapabilities = null;
    } else {
        this.desiredCapabilities = this.extend(this.desiredCapabilities, desiredCapabilities);
        if (desiredCapabilities.sessionId) {
            this.sessionId = desiredCapabilities.sessionId;
        }
    }

    this.requestHandler.create(
        commandOptions,
        {desiredCapabilities:this.desiredCapabilities, sessionId:null},
        callback
    );

};