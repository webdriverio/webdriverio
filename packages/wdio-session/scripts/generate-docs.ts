/**
 * Write website/docs/session/commands.md from the action specs, the same
 * source `wdio session <action> --help` prints from.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderCommandsMarkdown } from '../src/cli/help.js'

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'website', 'docs', 'session', 'commands.md')
fs.writeFileSync(file, renderCommandsMarkdown())
console.log(`Wrote ${path.relative(process.cwd(), file)}`)
