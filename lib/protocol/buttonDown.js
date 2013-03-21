exports.command = function (callback) {

    var commandOptions = {
        path:"/session/:sessionId/buttondown",
        method:"POST"
    };

    this.executeProtocolCommand(
        commandOptions,
        this.proxyResponseNoReturn(callback),
        {}
    );

};