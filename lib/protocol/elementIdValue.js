exports.command = function (id, value, callback) {

    var commandOptionsPost = {
        path:"/session/:sessionId/element/:id/value",
        method:"POST"
    };

    var commandOptionsGet = {
        path:"/session/:sessionId/element/:id/value",
        method:"GET"
    };

    var requestOptions = {};

    // set or get
    if (typeof value === "string") {

        requestOptions = commandOptionsPost;
        requestOptions.path = requestOptions.path.replace(/:id/gi, id);

        this.executeProtocolCommand(
            requestOptions,
            this.proxyResponseNoReturn(callback),
            {"value":value.split("")}
        );

    } else {

        callback = value;

        requestOptions = commandOptionsGet;
        requestOptions.path = requestOptions.path.replace(/:id/gi, id);

        this.executeProtocolCommand(
            requestOptions,
            this.proxyResponse(callback),
            {}
        );

    }
};
