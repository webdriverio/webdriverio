exports.command = function (id, callback) {

    var requestOptions = {
        path:"/session/:sessionId/element/:id/click",
        method:"POST"
    };

    requestOptions.path = requestOptions.path.replace(/:id/gi, id);

    this.requestHandler.create(requestOptions,{},callback);

};
