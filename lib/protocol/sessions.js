exports.command = function (callback) {

    var requestOptions = {
        path:"/sessions",
        method:"GET",
        requiresSession: false
    };

    this.requestHandler.create( requestOptions, {}, callback);

};
