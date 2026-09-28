import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, it } from 'vitest'

import { ACTIONS } from '../src/actions/specs.js'

const commands = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'website', 'docs', 'session', 'commands.md')

it('documents every session action and nothing else', () => {
    const documented = [...fs.readFileSync(commands, 'utf-8').matchAll(/^## `([a-z0-9-]+)`/gm)].map((match) => match[1])
    const registry = ACTIONS.map((action) => action.name)
    expect(documented).toEqual(registry)
})
