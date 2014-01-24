module.exports = function element (value, callback) {
    var findStrategy = require('../helpers/find-element-strategy.js');

    var found = findStrategy(arguments);

    this.requestHandler.create(
        "/session/:sessionId/element",
        { using: found.using, value: found.value },
        found.callback
    )
};