export default {
    cyanBright: jest.fn().mockImplementation((msg) => `cyanBright ${msg}`),
    greenBright: jest.fn().mockImplementation((msg) => `greenBright ${msg}`),
    redBright: jest.fn().mockImplementation((msg) => `redBright ${msg}`)
}
