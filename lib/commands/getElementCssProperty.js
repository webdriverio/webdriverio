/**
 *
 * @deprecated this command is obsolete since the selector API was introduced. Its only purpose is for backwards compability.
 * @use getCssProperty
 * @todo should be removed some day
 *
 * @uses properties/getCssProperty
 *
 */

module.exports = function getElementCssProperty (using, value, cssProperty, callback) {
    this.getCssProperty(value, cssProperty, callback);
};