exports.command = function (callback) {

    var commandOptions = {
        path:"/session/:sessionId/window_handles",
        method:"GET"
    };

    this.executeProtocolCommand(
        commandOptions,
        this.proxyResponse(callback),
        {}
    );

};