import fs from 'node:fs'
import path from 'node:path'
import { test, expect, vi } from 'vitest'
import { getPrototype } from '../../src/utils/index.js'
import { remote } from '../../src/index.js'

vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

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

test('no browser commands in element scope', async () => {
    const browser = await remote({
        baseUrl: 'http://foobar.com',
        capabilities: {
            browserName: 'foobar'
        }
    })

    const elem = await browser.$('#foo')
    expect(typeof elem.addValue).toBe('function')
    expect(typeof elem.setCookies).toBe('undefined')
})
