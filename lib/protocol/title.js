module.exports = function title (callback) {

    var requestOptions = {
        path:"/session/:sessionId/title",
        method:"GET"
    };

    this.requestHandler.create(requestOptions,{},callback);

};