/* eslint-disable @typescript-eslint/no-require-imports -- a CommonJS file */
const { ReportEvents } = require('@wdio/html-reporter')

describe('html reporter in CommonJS', () => {
    it('logs with ReportEvents from require()', () => {
        new ReportEvents().logMessage('a message from a CommonJS test')
    })
})
