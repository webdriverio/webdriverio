'use strict';

// detect es6 functionality
if (global.regeneratorRuntime) {
  module.exports = true;
} else {
  try {
    /* jshint evil:true */
    eval('(function*() { yield 1 })()');
    module.exports = true;
  } catch (e) {
    module.exports = false;
  }
}
