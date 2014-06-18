/**
 *
 * DEPRECATED!!!
 *
 * @deprecated only included for backward compatibility, please use timeoutsImplicitWait
 *
 * @see  /lib/protocol/timeoutsImplicitWait.js
 * @type protocol
 *
 */

module.exports = function implicitWait() {
    this.timeoutsImplicitWait.apply(this, arguments);
};