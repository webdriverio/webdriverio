module.exports = function doDoubleClick (callback) {

    var requestOptions = {
        path:"/session/:sessionId/doubleclick",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,callback);

};
