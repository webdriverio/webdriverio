exports.command = function (id, attributeName, callback) {

    var requestOptions = {
        path:"/session/:sessionId/element/:id/attribute/:name",
        method:"GET"
    };

    requestOptions.path = requestOptions.path.replace(/:id/gi, id);
    requestOptions.path = requestOptions.path.replace(/:name/gi, attributeName);

    this.requestHandler.create(requestOptions,{},callback);

};
