module.exports = function status (callback) {

    var requestOptions = {
        path:"/status",
        method:"GET"
    };

    this.requestHandler.create(requestOptions,{},callback);

};