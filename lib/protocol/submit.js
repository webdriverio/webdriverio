exports.command = function (id, callback) {

    var requestOptions = {
        path:"/session/:sessionId/element/:id/submit",
        method:"POST"
    };

    requestOptions.path = requestOptions.path.replace(/:id/gi, id);

    this.executeProtocolCommand(
        requestOptions,
        this.proxyResponseNoReturn(callback),
        {}
    );

};

