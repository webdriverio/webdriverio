export default {
    cyanBright: jest.fn().mockImplementation((msg) => `cyanBright ${msg}`),
    greenBright: jest.fn().mockImplementation((msg) => `greenBright ${msg}`),
    redBright: jest.fn().mockImplementation((msg) => `redBright ${msg}`),
    cyan: jest.fn().mockImplementation((msg) => `cyan ${msg}`),
    green: jest.fn().mockImplementation((msg) => `green ${msg}`),
    red: jest.fn().mockImplementation((msg) => `red ${msg}`),
    gray: jest.fn().mockImplementation((msg) => `gray ${msg}`)
}
