exports.command = function (windowHandle, callback) {

    var commandOptions = {
        path:"/session/:sessionId/window",
        method:"POST"
    };

    this.executeProtocolCommand(
        commandOptions,
        this.proxyResponseNoReturn(callback),
        {"name":windowHandle}
    );

};