#!/usr/bin/env node
import fs from 'node:fs'
import { computeDevVersion } from './devVersion.js'

const { version, distTag } = await computeDevVersion()
console.log(`Dev release version: ${version} (dist-tag: ${distTag})`)

if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\ndistTag=${distTag}\n`)
}
