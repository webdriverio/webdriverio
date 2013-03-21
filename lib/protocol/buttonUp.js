exports.command = function (callback) {

    var commandOptions = {
        path:"/session/:sessionId/buttonup",
        method:"POST"
    };

    this.executeProtocolCommand(
        commandOptions,
        this.proxyResponseNoReturn(callback),
        {}
    );

};