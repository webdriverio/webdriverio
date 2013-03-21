exports.command = function (opts, callback) {

    var commandOptions = {
        path:"/session/:sessionId/window/" + (opts.name || "current") + "/size",
        method:"POST"
    };

    this.executeProtocolCommand(
        commandOptions,
        this.proxyResponse(callback),
        {
            width:opts.width,
            height:opts.height
        }
    );

};
