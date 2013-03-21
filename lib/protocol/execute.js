exports.command = function (script, callback) {

    var commandOptions = {
        path:"/session/:sessionId/execute",
        method:"POST"
    };

    this.executeProtocolCommand(
        commandOptions,
        this.proxyResponse(callback),
        {"script":script, args:[]}
    );

};

