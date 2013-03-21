exports.command = function (callback) {

    var commandOptions = {
        path:"/status",
        method:"GET"
    };

    this.executeProtocolCommand(
        commandOptions,
        this.proxyResponse(callback),
        {}
    );

};