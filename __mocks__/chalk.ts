import { vi } from 'vitest'

class Chalk {
    white = {}
    bgRed = {}
    bgYellow = {}
    supportsColor = { hasBasic: true }

    private color = true
    constructor(options:{level?:number}){
        this.color = options.level === 0 ? false : this.color
    }

    bold(msg: string) { return `bold ${msg}` }
    cyanBright = vi.fn().mockImplementation((msg) => this.color ? `cyanBright ${msg}` : msg)
    greenBright = vi.fn().mockImplementation((msg) => this.color ? `greenBright ${msg}` : msg)
    whiteBright = vi.fn().mockImplementation((msg) => this.color ? `whiteBright ${msg}` : msg)
    redBright = vi.fn().mockImplementation((msg) => this.color ? `redBright ${msg}` : msg)
    cyan = vi.fn().mockImplementation((msg) => this.color ? `cyan ${msg}` : msg)
    blue = vi.fn().mockImplementation((msg) => this.color ? `blue ${msg}` : msg)
    grey = vi.fn().mockImplementation((msg) => this.color ? `grey ${msg}` : msg)
    green = vi.fn().mockImplementation((msg) => this.color ? `green ${msg}` : msg)
    red = vi.fn().mockImplementation((...msg: string[]) => this.color ? `red ${msg.join(' ')}` : msg.join(' '))
    gray = vi.fn().mockImplementation((...msg: string[]) => this.color ? `gray ${msg.join(' ')}` : msg.join(' '))
    black = vi.fn().mockImplementation((msg) => this.color ? `black ${msg}` : msg)
    yellow = vi.fn().mockImplementation((...msg: string[]) => this.color ? `yellow ${msg.join(' ')}` : msg.join(' '))
    magenta = vi.fn().mockImplementation((msg) => this.color ? `magenta ${msg}` : msg)
    bgGreen = vi.fn().mockImplementation((msg) => this.color ? `bgGreen ${msg}` : msg)
    dim = vi.fn().mockImplementation((msg) => this.color ? `dim ${msg}` : msg)
}

export default new Chalk({})
export { Chalk }
