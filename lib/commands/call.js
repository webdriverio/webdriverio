/**
 *
 * call own function wihtin the chain
 *
 * ### Example usage
 *
 *     it('some title', function(done) {
 *
 *         client
 *             .commandA()
 *             .commandB()
 *
 *             // use call to end async test spec (e.g. in Mocha or Jasmine)
 *             .call(end);
 *
 *     });
 *
 */

module.exports = function call (callback) {
    process.nextTick(callback);
};