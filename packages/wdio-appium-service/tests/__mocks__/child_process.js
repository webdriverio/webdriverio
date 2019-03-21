const childProcess = jest.genMockFromModule('child_process')
childProcess.spawn = jest.fn()
module.exports = childProcess
