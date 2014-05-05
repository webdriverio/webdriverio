/**
 *
 * Click on a button using a css selector.
 *
 * @param {String} selector button element
 * @deprecated still included for backward compatibility (see click / tap)
 *
 */

module.exports = function buttonClick () {

    var isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    if(!isMobile) {

        return this.click.apply(this, arguments);

    } else {

        /*!
         * TODO replace tap command with touchMove/touchDown/touchUp command chain
         * (if implemented in appium)
         */
        return this.tap.apply(this, arguments);

    }
};