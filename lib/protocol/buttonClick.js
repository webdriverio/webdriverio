var handleMouseButtonProtocol = require('../helpers/handleMouseButtonProtocol');

module.exports = function buttonClick (button, callback) {

    handleMouseButtonProtocol.call(
        this,
        "/session/:sessionId/click",
        button, callback
    );

};
