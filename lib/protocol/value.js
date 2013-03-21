exports.command = function (id, value, callback) {

    var commandOptionsPost = {
        path:"/session/:sessionId/element/:id/value",
        method:"POST"
    };

    var commandOptionsGet = {
        path:"/session/:sessionId/element/:id/value",
        method:"GET"
    };

    // set or get
    if (typeof value === "string") {

        this.executeProtocolCommand(
            commandOptionsPost,
            this.proxyResponseNoReturn(callback),
            {"value":value.split("")}
        );

    } else {

        this.executeProtocolCommand(
            commandOptionsGet,
            this.proxyResponse(value),
            {}
        );

    }
};

