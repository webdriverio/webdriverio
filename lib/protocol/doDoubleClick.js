exports.command = function (callback) {

    var requestOptions = {
        path:"/session/:sessionId/doubleclick",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{},callback);

};
