module.exports = function file (base64data, callback) {

    var requestOptions = {
        path:"/session/:sessionId/file",
        method:"POST"
    };

    this.requestHandler.create(requestOptions,{
        file: base64data
    },callback);

};