// call must be scoped to the webdriverjs client
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

    this.requestHandler.create(
        requestPath,
        { button: button },
        callback
    );
};