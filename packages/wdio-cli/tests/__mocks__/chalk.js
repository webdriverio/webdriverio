const chalkMock = {}
chalkMock.cyanBright = jest.fn().mockImplementation((msg) => `cyanBright ${msg}`)
chalkMock.greenBright = jest.fn().mockImplementation((msg) => `greenBright ${msg}`)
chalkMock.whiteBright = jest.fn().mockImplementation((msg) => `whiteBright ${msg}`)
chalkMock.redBright = jest.fn().mockImplementation((msg) => `redBright ${msg}`)
chalkMock.cyan = jest.fn().mockImplementation((msg) => `cyan ${msg}`)
chalkMock.blue = jest.fn().mockImplementation((msg) => `blue ${msg}`)
chalkMock.green = jest.fn().mockImplementation((msg) => `green ${msg}`)
chalkMock.red = jest.fn().mockImplementation((msg) => `red ${msg}`)
chalkMock.gray = jest.fn().mockImplementation((msg) => `gray ${msg}`)
chalkMock.black = jest.fn().mockImplementation((msg) => `black ${msg}`)
chalkMock.white = chalkMock
chalkMock.yellow = jest.fn().mockImplementation((msg) => `yellow ${msg}`)
chalkMock.magenta = jest.fn().mockImplementation((msg) => `magenta ${msg}`)
chalkMock.bgGreen = jest.fn().mockImplementation((msg) => `bgGreen ${msg}`)
chalkMock.supportsColor = { hasBasic: true }
chalkMock.bgYellow = chalkMock
chalkMock.bgRed = chalkMock
chalkMock.bold = function (msg) { return `bold ${msg}` }
chalkMock.bold.__proto__ = chalkMock

export default chalkMock
