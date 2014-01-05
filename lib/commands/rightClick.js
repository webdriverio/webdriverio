var handleMouseButtonCommand = require('../helpers/handleMouseButtonCommand');

module.exports = function rightClick (cssSelector, callback) {

    handleMouseButtonCommand.call(
        this,
        cssSelector,
        'right',
        callback
    );

};