// call must be scoped to the webdriverio client
module.exports = function(requestPath, button) {

    var buttonEnum = {
        left: 0,
        middle: 1,
        right: 2
    };

    if(typeof button !== 'number') {
        button = buttonEnum[button || 'left'];
    }

    return this.requestHandler.create(
        requestPath,
        { button: button }
    );
};