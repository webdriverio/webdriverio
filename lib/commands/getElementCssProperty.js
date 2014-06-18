/**
 *
 * @deprecated this command is obsolete since the selector API was introduced. Its only purpose is for backwards compability.
 *
 * @uses property/getCssProperty
 * @type property
 *
 */

module.exports = function getElementCssProperty (using, value, cssProperty, callback) {
    this.getCssProperty(value, cssProperty, callback);
};