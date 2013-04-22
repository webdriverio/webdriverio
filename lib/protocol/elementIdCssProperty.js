exports.command = function (id, cssProperyName, callback) {

    var requestOptions = {
        path:"/session/:sessionId/element/:id/css/:propertyName",
        method:"GET"
    };

    requestOptions.path = requestOptions.path.replace(/:id/gi, id);
    requestOptions.path = requestOptions.path.replace(":propertyName", cssProperyName);

    this.requestHandler.create(requestOptions,{},callback);

};
