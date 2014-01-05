var handleMouseButtonProtocol = require('../helpers/handleMouseButtonProtocol');

module.exports = function buttonPress (button, callback) {

    handleMouseButtonProtocol.call(
        this,
        "/session/:sessionId/click",
        button, callback
    );

};
