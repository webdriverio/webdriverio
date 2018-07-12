/* eslint-disable no-console */

const WDIOReporter = require('../../../../packages/wdio-reporter/build')

module.exports = class CustomReporter extends WDIOReporter {
    constructor (options) {
        super(options)
        console.log('initialised custom reporter with the following reporter options:', options);

        this.on('start', () => console.log('start'))
        this.on('end', () => console.log('end'))
        this.on('suite:start', () => console.log('suite:start'))
        this.on('suite:end', () => console.log('suite:end'))
        this.on('test:start', () => console.log('test:start'))
        this.on('test:end', () => console.log('test:end'))
        this.on('hook:start', () => console.log('hook:start'))
        this.on('hook:end', () => console.log('hook:end'))
        this.on('test:pass', () => console.log('test:pass'))
        this.on('test:fail', () => console.log('test:fail'))
        this.on('test:pending', () => console.log('test:pending'))

        this.write('Some log line')
    }
}
