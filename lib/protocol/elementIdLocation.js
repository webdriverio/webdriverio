exports.command = function (id, callback) {

    var requestOptions = {
        path:"/session/:sessionId/element/:id/location",
        method:"GET"
    };

    requestOptions.path = requestOptions.path.replace(/:id/gi, id);

    this.executeProtocolCommand(
        requestOptions,
        this.proxyResponseNoReturn(callback),
        {}
    );

};
