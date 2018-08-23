const util = require('util')
const events = require('events')

const SweetReporter = function (baseReporter, config, options) {
    this.on('start', function () { console.log('start') })
}

SweetReporter.reporterName = 'SweetReporter'

util.inherits(SweetReporter, events.EventEmitter)

exports = module.exports = SweetReporter
