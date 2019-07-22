const { readdirSync } = jest.requireActual('fs')
const fs = jest.genMockFromModule('fs')
fs.writeFileSync = jest.fn()
fs.existsSync = jest.fn(() => true)
fs.readdirSync.mockImplementation(readdirSync)

export default fs
