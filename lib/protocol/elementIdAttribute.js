module.exports = function elementIdAttribute (id, attributeName, callback) {

    var requestPath = "/session/:sessionId/element/:id/attribute/:name";

    requestPath = requestPath.replace(/:id/gi, id);
    requestPath = requestPath.replace(/:name/gi, attributeName);

    this.requestHandler.create(requestPath,callback);

};
