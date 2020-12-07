const yargs = {}
yargs.commandDir = jest.fn(() => yargs)
yargs.example = jest.fn(() => yargs)
yargs.argv = { _: ['wdio.conf.js'] }
yargs.epilogue = jest.fn().mockReturnValue(yargs)
yargs.options = jest.fn(() => yargs)
yargs.updateStrings = jest.fn(() => yargs)
yargs.parse = jest.fn()
yargs.env = jest.fn().mockReturnValue(yargs)
yargs.help = jest.fn().mockReturnValue(yargs)

export default yargs
