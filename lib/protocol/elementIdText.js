exports.command = function (id, callback) {

    var requestOptions = {
        path:"/session/:sessionId/element/:id/text",
        method:"GET"
    };

    requestOptions.path = requestOptions.path.replace(/:id/gi, id);

    this.requestHandler.create(requestOptions,{},callback);

};
