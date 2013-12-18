// call must be scoped to WebdriverJs.prototype
module.exports = function(requestPath, button, callback) {

    var buttonEnum = {
        left: 0,
        middle: 1,
        right: 2
    };

    if(typeof callback !== 'function' && typeof button === 'function') {
        callback = button;
        button = buttonEnum.left;
    }
    if(typeof button !== 'number') {
        button = buttonEnum[button || 'left'];
    }
    if(typeof requestPath !== 'string' ||
        typeof button !== 'number' ||
        (callback && typeof callback !== 'function')
        ) {
        throw 'invalid arguments to a buttonClick, buttonDown, or buttonUp protocol. The buttonClick command was renamed to clickMouseButton.';
    }

    this.requestHandler.create(
        {
            path: requestPath,
            method: "POST"
        },
        {
            button: button
        },
        callback
    );
};