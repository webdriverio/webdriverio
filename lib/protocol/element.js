module.exports = function element () {
    var findStrategy = require('../helpers/find-element-strategy.js'),
        found = findStrategy(arguments);

    this.requestHandler.create(
        '/session/:sessionId/element',
        { using: found.using, value: found.value },
        found.callback
    );
};