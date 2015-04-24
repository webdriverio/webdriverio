
var promisesTest = require('promises-aplus-tests');
var Promise = require('./test')

var adapter = {
  fulfilled: function (value) {
    var promise = new Promise()
    return promise.resolve(value)
  },
  rejected: function (reason) {
    var promise = new Promise()
    return promise.reject(reason)
  },
  pending: function () {
    var promise = new Promise()
    return {
      promise: promise,
      fulfill: promise.resolve.bind(promise),
      reject: promise.reject.bind(promise)
    }
  }
}

promisesTest(adapter, function (er) {
  if (er) console.error(er)
  process.exit()
})