module.exports = function elements () {
    var findStrategy = require('../helpers/find-element-strategy.js');

    var found = findStrategy(arguments);

    this.requestHandler.create(
        '/session/:sessionId/elements',
        { using: found.using, value: found.value },
        found.callback
    );
};