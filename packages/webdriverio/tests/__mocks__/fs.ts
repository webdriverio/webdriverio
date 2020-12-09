import type * as fsType from 'fs'

const fs = jest.genMockFromModule<typeof fsType>('fs')
fs.writeFileSync = jest.fn()
fs.existsSync = jest.fn(() => true)
module.exports = fs
