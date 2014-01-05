var handleMouseButtonProtocol = require('../helpers/handleMouseButtonProtocol');

module.exports = function buttonDown (button, callback) {

    handleMouseButtonProtocol.call(
        this,
        "/session/:sessionId/buttondown",
        button, callback
    );

};