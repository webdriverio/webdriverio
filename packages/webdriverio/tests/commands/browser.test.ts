import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from 'vitest'
import { getPrototype } from '../../src/utils/index.js'

const IGNORED_COMMANDS = ['addCommand', 'overwriteCommand']
const browserScope = 'browser'
const scopes = ['mobile'].concat(browserScope)
const baseDir = path.resolve(__dirname, '../..', 'src', 'commands')
const files = scopes.flatMap(scope => {
    const dir = path.join(baseDir, scope)
    return fs
        .readdirSync(dir)
        .map(f => path.basename(f, path.extname(f)))
        .filter(f => !IGNORED_COMMANDS.includes(f))
})

test(browserScope + ' commands list and strategies', () => {
    const browserPrototype = Object.keys(getPrototype(browserScope))
    const combinedPrototype = [
        ...new Set([...browserPrototype, ...files])
    ]
    const expected = [
        'puppeteer', ...files, 'strategies',
        // Normally the flags are not "returned" because they are added in a different step
        'isNativeContext', 'mobileContext'
    ]

    expect(combinedPrototype.sort()).toEqual(expected.sort())
})
