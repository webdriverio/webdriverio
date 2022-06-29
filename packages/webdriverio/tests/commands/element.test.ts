import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from 'vitest'
import { getPrototype } from '../../src/utils'

const scope = 'element'
const dir = path.resolve(__dirname, '../..', 'src', 'commands', scope)
const files = fs
    .readdirSync(dir)
    .map(f => path.basename(f, path.extname(f)))

test(scope + ' commands list and strategies', () => {
    const prototype = Object.keys(getPrototype(scope))
    const expected = ['puppeteer', ...files, 'strategies']

    expect(prototype.sort()).toEqual(expected.sort())
})
