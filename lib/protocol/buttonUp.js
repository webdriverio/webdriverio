var handleMouseButtonProtocol = require('../helpers/handleMouseButtonProtocol');

module.exports = function buttonUp (button, callback) {

    handleMouseButtonProtocol.call(
        this,
        "/session/:sessionId/buttonup",
        button, callback
    );

};