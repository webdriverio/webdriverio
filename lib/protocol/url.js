module.exports = function url (args, callback) {
    var data = {};
    if (typeof args === 'string') {
        data.url = args;
    } else {
        callback = args;
    }

    this.requestHandler.create(
        '/session/:sessionId/url',
        data,
        callback
    );
};

