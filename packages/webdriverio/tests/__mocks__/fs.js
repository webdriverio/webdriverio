const fs = jest.genMockFromModule('fs')
fs.writeFileSync = jest.fn()
fs.existsSync = jest.fn(() => true)
export default fs
