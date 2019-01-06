const fs = jest.genMockFromModule('fs')
fs.writeFileSync = (path, data, options) => path
fs.existsSync = () => true
export default fs
