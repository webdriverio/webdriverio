module.exports = function status (callback) {

    var requestOptions = {
        path: '/status',
        method: 'GET',
        requiresSession: false
    };

    this.requestHandler.create( requestOptions, {}, callback);

};