'use strict';

module.exports = (function () {
  // detect es6 functionality
  try {
    // this succeeds either with native generators or with regenerator (Babel):
    return require('./detectHarmony.generator.js').next().value;

  } catch (err) {
    // otherwise, assume generators are unavailable:
    return false;
  }
})();
