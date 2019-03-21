const fs = jest.genMockFromModule('fs-extra')
fs.createWriteStream = jest.fn()
fs.ensureFileSync = jest.fn()
module.exports = fs
