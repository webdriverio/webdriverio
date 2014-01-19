module.exports = function elements (value, callback) {
    var findStrategy = require('../helpers/find-element-strategy.js');

    var requestOptions = {
            path:"/session/:sessionId/elements",
            method:"POST"
        };

    var found = findStrategy(arguments);

    this.requestHandler.create(
        requestOptions, {
            'using': found.using,
            'value': found.value
        },
        found.callback
    );
};