module.exports = function mouseClick (button, callback) {

    if(arguments.length === 1) {
        callback = arguments[0];
        button = 0;
    }

    var requestOptions = {
        path:"/session/:sessionId/click",
        method:"POST"
    };

    var buttonNumbers = {
        LEFT: 0,
        MIDDLE: 1,
        RIGHT: 2
    };

    var data = {
        button: typeof button === 'number' ? button : buttonNumbers[button]
    };

    this.requestHandler.create(requestOptions,data,callback);

};
