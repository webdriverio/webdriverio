/**
 *
 * Click on a button using a css selector.
 *
 * @param {String} selector button element
 * @deprecated still included for backward compatibility (see click)
 *
 */

module.exports = function buttonClick () {

    return this.click.apply(this, arguments);

};