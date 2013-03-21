exports.command = function (callback) {

    var commandOptions = {
        path:"/session/:sessionId/title",
        method:"GET"
    };

    this.executeProtocolCommand(
        commandOptions,
        this.proxyResponse(callback),
        {}
    );

};