exports.command = function (using, value, callback) {

    var requestOptions = {
        path:"/session/:sessionId/element",
        method:"POST"
    };

    var check = /class name|css selector|id|name|link text|partial link text|tag name|xpath/gi;
    if (!using.match(check)) {
        throw "Please provide any of the following using strings as the first parameter: class name, css selector, id, name, link text, partial link text, tag name or xpath";
    }

    this.requestHandler.create(requestOptions,{"using":using, "value":value},callback);

};