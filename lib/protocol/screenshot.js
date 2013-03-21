exports.command = function (callback) {

    var commandOptions = {
        path:"/session/:sessionId/screenshot",
        method:"GET"
    };

    this.executeProtocolCommand(
        commandOptions,
        this.proxyResponseNoReturn(callback),
        {}
    );

};