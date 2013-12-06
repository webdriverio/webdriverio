module.exports = function alertText (callback) {

    var requestOptions = {
        path:"/session/:sessionId/alert_text",
        method:"GET"
    };

    this.requestHandler.create(requestOptions,{},callback);

};
