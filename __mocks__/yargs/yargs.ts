import { vi } from 'vitest'
const yargs: any = {}
yargs.commandDir = vi.fn(() => yargs)
yargs.example = vi.fn(() => yargs)
yargs.argv = { _: ['wdio.conf.js'] }
yargs.epilogue = vi.fn().mockReturnValue(yargs)
yargs.options = vi.fn(() => yargs)
yargs.updateStrings = vi.fn(() => yargs)
yargs.parse = vi.fn().mockReturnValue(yargs.argv)
yargs.env = vi.fn().mockReturnValue(yargs)
yargs.help = vi.fn().mockReturnValue(yargs)

export default vi.fn().mockReturnValue(yargs)
export { yargs }
