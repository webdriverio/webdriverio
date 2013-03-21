exports.command = function (callback) {

    var commandOptions = {
        path:"/session/:sessionId/doubleclick",
        method:"POST"
    };

    this.executeProtocolCommand(
        commandOptions,
        this.proxyResponseNoReturn(callback),
        {}
    );

};
