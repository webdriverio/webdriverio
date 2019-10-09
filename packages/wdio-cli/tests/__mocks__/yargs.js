const yargs = {}
yargs.commandDir = jest.fn(() => yargs)
yargs.example = jest.fn(() => yargs)
yargs.epilogue = () => ({
    argv: { _: ['wdio.conf.js'] },
    options: jest.fn()
})
yargs.options = jest.fn(() => yargs)
yargs.updateStrings = jest.fn(() => yargs)
yargs.parse = jest.fn()

export default yargs
