module.exports = function url (url, callback) {
    var data = {};
    if (typeof url === 'string') {
        data.url = url;
    } else {
        callback = url;
    }

    this.requestHandler.create(
        "/session/:sessionId/url",
        data,
        callback
    );
};

