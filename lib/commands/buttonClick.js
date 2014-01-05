// Deprecated but included for backward compatibility. Alias for 'click' command.
module.exports = function buttonClick () {

    var isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    if(!isMobile) {

        return this.click.apply(this, arguments);

    } else {

        // TODO replace tap command with touchMove/touchDown/touchUp command chain
        // (if implemented in appium)
        return this.tap.apply(this, arguments);

    }
};