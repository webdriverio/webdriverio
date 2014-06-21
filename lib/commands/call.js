/**
 *
 * Call an own function within running chain.
 *
 * @param {Function} callback  function to be called
 * @type utility
 *
 * <example>
    :call.js
    it('some title', function(done) {

        client
            .click('#elemA')
            .setValue('.firstname','webdriverbot')

            // use call to end async test spec (e.g. in Mocha or Jasmine)
            .call(end);

    });
 * </example>
 */

module.exports = function call (callback) {
    process.nextTick(callback);
};