var ErrorHandler = require('../utils/ErrorHandler.js');

/**
 * call must be scoped to the webdriverio client
 */
module.exports = function(selector, button) {

    /**
     * mobile only supports simple clicks
     */
    if(this.isMobile) {
        if(!selector) {
            throw new ErrorHandler.ProtocolError('the leftClick/middleClick/rightClick command requires an element to click on');
        }

        return this.click(selector);
    }

    /**
     * just press button if no selector is given
     */
    if (!selector) {
        return this.buttonPress(button);
    }

    return this.element(selector).then(function(res) {
        return this.moveTo(res.value.ELEMENT).buttonPress(button);
    });

};