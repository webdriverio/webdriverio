exports.command = function (id, keys, callback) {

    var requestOptions = {
        path:"/session/:sessionId/element/:id/value",
        method:"POST"
    };

    requestOptions.path = requestOptions.path.replace(/:id/gi, id);

    this.requestHandler.create(requestOptions,{"value":[keys]},callback);

};
