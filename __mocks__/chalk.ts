import { vi } from 'vitest'

const chalkMock: any = {}
chalkMock.cyanBright = vi.fn().mockImplementation((msg) => `cyanBright ${msg}`)
chalkMock.greenBright = vi.fn().mockImplementation((msg) => `greenBright ${msg}`)
chalkMock.whiteBright = vi.fn().mockImplementation((msg) => `whiteBright ${msg}`)
chalkMock.redBright = vi.fn().mockImplementation((msg) => `redBright ${msg}`)
chalkMock.cyan = vi.fn().mockImplementation((msg) => `cyan ${msg}`)
chalkMock.blue = vi.fn().mockImplementation((msg) => `blue ${msg}`)
chalkMock.grey = vi.fn().mockImplementation((msg) => `grey ${msg}`)
chalkMock.green = vi.fn().mockImplementation((msg) => `green ${msg}`)
chalkMock.red = vi.fn().mockImplementation((...msg: string[]) => `red ${msg.join(' ')}`)
chalkMock.gray = vi.fn().mockImplementation((...msg: string[]) => `gray ${msg.join(' ')}`)
chalkMock.black = vi.fn().mockImplementation((msg) => `black ${msg}`)
chalkMock.white = chalkMock
chalkMock.yellow = vi.fn().mockImplementation((...msg: string[]) => `yellow ${msg.join(' ')}`)
chalkMock.magenta = vi.fn().mockImplementation((msg) => `magenta ${msg}`)
chalkMock.bgGreen = vi.fn().mockImplementation((msg) => `bgGreen ${msg}`)
chalkMock.dim = vi.fn().mockImplementation((msg) => `dim ${msg}`)
chalkMock.supportsColor = { hasBasic: true }
chalkMock.bgYellow = chalkMock
chalkMock.bgRed = chalkMock
chalkMock.bold = function (msg: string) { return `bold ${msg}` }
chalkMock.bold.__proto__ = chalkMock

export default chalkMock
