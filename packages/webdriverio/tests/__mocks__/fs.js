const fs = jest.genMockFromModule('fs')
fs.writeFileSync = jest.fn()
fs.existsSync = () => true
export default fs
