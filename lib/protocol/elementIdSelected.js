module.exports = function elementIdSelected (id, callback) {

    var requestOptions = {
        path:"/session/:sessionId/element/:id/selected",
        method:"GET"
    };

    requestOptions.path = requestOptions.path.replace(/:id/gi, id);

    this.requestHandler.create(requestOptions,{},callback);

};
