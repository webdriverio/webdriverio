const fs = jest.genMockFromModule('fs')
fs.writeFileSync = (path, data, options) => {path, data, options}
fs.existsSync = () => true
export default fs
