var handleMouseButtonCommand = require('../helpers/handleMouseButtonCommand');

module.exports = function leftClick (cssSelector, callback) {

    handleMouseButtonCommand.call(
        this,
        cssSelector,
        'left',
        callback
    );

};