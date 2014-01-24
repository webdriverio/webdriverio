module.exports = function elementIdElement (id, using, value, callback) {

    var requestPath = "/session/:sessionId/element/:id/element"
        .replace(/:id/gi, id);

    if (!using.match(/class name|css selector|id|name|link text|partial link text|tag name|xpath/gi)) {
        throw "Please provide any of the following using strings as the first parameter: class name, css selector, id, name, link text, partial link text, tag name or xpath";
    }

    this.requestHandler.create(requestPath,{"using":using, "value":value},callback);

};