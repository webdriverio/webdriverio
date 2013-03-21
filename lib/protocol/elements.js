exports.command = function (using, value, callback) {

    var commandOptions = {
        path:"/session/:sessionId/elements",
        method:"POST"
    };

    if (!using.match(/class name|css selector|id|name|link text|partial link text|tag name|xpath/gi)) {
        throw "Please provide any of the following using strings as the first parameter: class name, css selector, id, name, link text, partial link text, tag name or xpath";
    }

    this.executeProtocolCommand(
        commandOptions,
        this.proxyResponse(callback),
        {"using":using, "value":value}
    );

};