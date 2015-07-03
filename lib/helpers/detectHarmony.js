'use strict';

try {
  // detect es6 functionality
  /* jshint evil:true */
  eval('(function*() { yield 1 })()');
  module.exports = true;
} catch (e) {
  module.exports = false;
}