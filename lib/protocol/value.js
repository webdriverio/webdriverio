exports.command = function (id, value, callback) {

    var requestOptionsPost = {
        path:"/session/:sessionId/element/:id/value",
        method:"POST"
    };

    var requestOptionsGet = {
        path:"/session/:sessionId/element/:id/value",
        method:"GET"
    };

    // set or get
    if (typeof value === "string") {

        this.requestHandler.create(requestOptionsPost,{"value":value.split("")},callback);

    } else {

        this.requestHandler.create(requestOptionsGet,{},value);

    }
};

