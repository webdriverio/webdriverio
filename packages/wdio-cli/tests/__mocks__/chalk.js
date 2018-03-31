const chalkMock = {}
chalkMock.cyanBright = jest.fn().mockImplementation((msg) => `cyanBright ${msg}`)
chalkMock.greenBright = jest.fn().mockImplementation((msg) => `greenBright ${msg}`)
chalkMock.redBright = jest.fn().mockImplementation((msg) => `redBright ${msg}`)
chalkMock.cyan = jest.fn().mockImplementation((msg) => `cyan ${msg}`)
chalkMock.green = jest.fn().mockImplementation((msg) => `green ${msg}`)
chalkMock.red = jest.fn().mockImplementation((msg) => `red ${msg}`)
chalkMock.gray = jest.fn().mockImplementation((msg) => `gray ${msg}`)
chalkMock.black = jest.fn().mockImplementation((msg) => `black ${msg}`)
chalkMock.yellow = jest.fn().mockImplementation((msg) => `yellow ${msg}`)
chalkMock.supportsColor = { hasBasic: true }
chalkMock.bgYellow = chalkMock
chalkMock.bgRed = chalkMock

export default chalkMock
