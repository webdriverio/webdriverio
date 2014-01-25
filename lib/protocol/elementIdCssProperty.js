module.exports = function elementIdCssProperty (id, cssProperyName, callback) {
    var requestPath = "/session/:sessionId/element/:id/css/:propertyName"

    requestPath = requestPath.replace(/:id/gi, id);
    requestPath = requestPath.replace(":propertyName", cssProperyName);

    this.requestHandler.create(requestPath,callback);

};
