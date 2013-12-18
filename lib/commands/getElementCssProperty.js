/**
 * this command is obsolete since the selector API was introduced.
 * Its only purpose is for backwards compability.
 * TODO should be removed some day
 */
module.exports = function getElementCssProperty (using, value, cssProperty, callback) {
    this.getCssProperty(value, cssProperty, callback);
};