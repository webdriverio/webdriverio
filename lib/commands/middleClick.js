var handleMouseButtonCommand = require('../helpers/handleMouseButtonCommand');

module.exports = function middleClick (cssSelector, callback) {

    handleMouseButtonCommand.call(
        this,
        cssSelector,
        'middle',
        callback
    );

};