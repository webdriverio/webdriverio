const fs = require('node:fs')
const filename = browser.config.retryFilename

describe('fail on first run and succeed on second', function () {
    it(`pass if ${filename} exists, otherwise create it and fail`, function () {
        if (!fs.existsSync(filename)) {
            fs.closeSync(fs.openSync(filename, 'w'))
            throw Error('Deliberate error.')
        }
    })
})
