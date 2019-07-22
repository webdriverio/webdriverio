import fs from 'fs'
import path from 'path'
import { getPrototype } from '../../src/utils'

const scope = 'browser'
const dir = path.resolve(__dirname, '../..', 'src', 'commands', scope)
const files = fs
    .readdirSync(dir)
    .map(f => path.basename(f, path.extname(f)))

test(scope + ' commands list', () => {
    const prototype = Object.keys(getPrototype(scope))
    expect(prototype).toEqual(files)
})
