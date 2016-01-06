/**
 *
 * Call an own function within running chain. It is mostly used to end an async BDD/TDD block (see example below).
 *
 * <example>
    :call.js
    it('some title', function(done) {
        client
            .click('#elemA')
            .setValue('.firstname','webdriverbot')
            // use call to end async test spec (e.g. in Mocha or Jasmine)
            .call(done);
    });
 * </example>
 *
 * @param {Function} callback  function to be called
 * @type utility
 *
 */
