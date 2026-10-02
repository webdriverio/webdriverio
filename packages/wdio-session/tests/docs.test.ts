import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, it } from 'vitest'

import { renderCommandsMarkdown } from '../src/cli/help.js'

const commands = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'website', 'docs', 'session', 'commands.md')

it('generates the commands page from the action specs', () => {
    expect(fs.readFileSync(commands, 'utf-8'), 'Run `pnpm run docs:session-commands`').toBe(renderCommandsMarkdown())
})
